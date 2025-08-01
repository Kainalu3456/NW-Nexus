const { ipcRenderer } = require("electron");
const path = require('path');
const fs = require('fs');

// Global Copy to Clipboard Manager
class ClipboardManager {
  constructor() {
    this.setupGlobalCopyHandler();
    this.setupIframeCopySupport();
  }

  setupGlobalCopyHandler() {
    // Listen for copy requests from iframes or other sources
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'COPY_TO_CLIPBOARD') {
        this.copyToClipboard(event.data.text, event.data.source);
      }
    });

    // Also listen for custom copy events
    document.addEventListener('copyRequest', (event) => {
      if (event.detail && event.detail.text) {
        this.copyToClipboard(event.detail.text, event.detail.source || 'app');
      }
    });
  }

  setupIframeCopySupport() {
    // Add a global copy function that can be called from anywhere
    window.globalCopyToClipboard = (text, source = 'unknown') => {
      this.copyToClipboard(text, source);
    };

    // Add a context menu for iframes to enable copy functionality
    this.setupIframeContextMenu();
    
    // Add keyboard shortcuts for copy functionality
    this.setupKeyboardShortcuts();
    
    // Inject copy helper script into iframes
    this.setupIframeCopyInjection();
  }

  setupIframeCopyInjection() {
    // Monitor iframe loads and inject copy functionality
    const iframeContainers = document.querySelectorAll('#tab-nwd, #tab-nwb, #tab-map');
    
    iframeContainers.forEach(container => {
      const iframe = container.querySelector('iframe');
      if (iframe) {
        iframe.addEventListener('load', () => {
          this.injectCopyScript(iframe);
          this.addManualCopyButton(container, iframe);
          
          // Special handling for NW Buddy iframe
          if (container.id === 'tab-nwb') {
            this.setupNWBuddyCopyHandlers(iframe);
          }
        });
      }
    });
  }

  addManualCopyButton(container, iframe) {
    // Add a manual copy button to the container
    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '📋 Copy Share URL';
    copyBtn.className = 'manual-copy-btn';
    copyBtn.title = 'Copy gearset share URL from page';
    copyBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: linear-gradient(135deg, var(--primary-color, #9370db) 0%, var(--primary-dark, #663399) 100%);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 2px 8px var(--shadow-color, rgba(147, 112, 219, 0.3));
      transition: all 0.2s ease;
      opacity: 0.8;
    `;
    
    copyBtn.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1';
      copyBtn.style.transform = 'scale(1.05)';
    });
    
    copyBtn.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0.8';
      copyBtn.style.transform = 'scale(1)';
    });
    
    copyBtn.addEventListener('click', () => {
      this.copyShareUrlFromIframe(iframe, copyBtn);
    });
    
    // Add to container
    const iframeContainer = container.querySelector('.iframe-container');
    if (iframeContainer) {
      iframeContainer.appendChild(copyBtn);
    }
  }

  setupNWBuddyCopyHandlers(iframe) {
    try {
      // Try to access iframe content (may fail due to CORS)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      if (iframeDoc) {
        // Set up a mutation observer to watch for dynamically added buttons
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                // Look for copy buttons and interactive buttons in the added content
                const copyButtons = node.querySelectorAll ? node.querySelectorAll('[class*="copy"], [id*="copy"], button[onclick*="copy"], .copy-btn') : [];
                copyButtons.forEach(button => this.enhanceNWBuddyCopyButton(button, iframe));
                
                // Look for join-item buttons and other interactive elements
                const joinButtons = node.querySelectorAll ? node.querySelectorAll('.join-item, [class*="join"], [class*="add"], [class*="share"]') : [];
                joinButtons.forEach(button => this.enhanceNWBuddyInteractiveButton(button, iframe));
                
                // Also check if the node itself is a button
                if (node.matches) {
                  if (node.matches('[class*="copy"], [id*="copy"], button[onclick*="copy"], .copy-btn')) {
                    this.enhanceNWBuddyCopyButton(node, iframe);
                  } else if (node.matches('.join-item, [class*="join"], [class*="add"], [class*="share"]')) {
                    this.enhanceNWBuddyInteractiveButton(node, iframe);
                  }
                }
              }
            });
          });
        });
        
        // Start observing
        observer.observe(iframeDoc.body, {
          childList: true,
          subtree: true
        });
        
        // Also enhance existing buttons
        const existingCopyButtons = iframeDoc.querySelectorAll('[class*="copy"], [id*="copy"], button[onclick*="copy"], .copy-btn');
        existingCopyButtons.forEach(button => this.enhanceNWBuddyCopyButton(button, iframe));
        
        const existingJoinButtons = iframeDoc.querySelectorAll('.join-item, [class*="join"], [class*="add"], [class*="share"]');
        existingJoinButtons.forEach(button => this.enhanceNWBuddyInteractiveButton(button, iframe));
        
      } else {
        // CORS blocked access, use alternative approach
        console.log('CORS blocked iframe access, using alternative approach');
        this.setupAlternativeNWBuddyHandlers(iframe);
      }
      
    } catch (error) {
      console.error('Error setting up NW Buddy copy handlers:', error);
      // Fallback to alternative approach
      this.setupAlternativeNWBuddyHandlers(iframe);
    }
  }

  enhanceNWBuddyInteractiveButton(button, iframe) {
    try {
      // Store original click handler if it exists
      const originalClick = button.onclick;
      
      // Add our enhanced click handler
      button.addEventListener('click', (e) => {
        // Let the original handler run first
        if (originalClick) {
          originalClick.call(button, e);
        }
        
        // Then add our functionality
        this.handleNWBuddyInteractiveAction(button, iframe, e);
      });
      
    } catch (error) {
      console.error('Error enhancing NW Buddy interactive button:', error);
    }
  }

  handleNWBuddyInteractiveAction(button, iframe, event) {
    try {
      const buttonClass = button.className || '';
      const buttonText = button.textContent || '';
      
      // Handle different types of interactive buttons
      if (buttonClass.includes('join-item')) {
        this.handleJoinItemAction(button, iframe);
      } else if (buttonClass.includes('share') || buttonText.includes('Share')) {
        this.handleShareAction(button, iframe);
      } else if (buttonClass.includes('add') || buttonText.includes('Add')) {
        this.handleAddAction(button, iframe);
      } else {
        // Generic interactive button handling
        this.handleGenericInteractiveAction(button, iframe);
      }
      
    } catch (error) {
      console.error('Error handling NW Buddy interactive action:', error);
    }
  }

  handleJoinItemAction(button, iframe) {
    try {
      // Find the item information near the button
      const container = button.closest('.item, .gear, .equipment, [class*="item"], [class*="gear"]');
      if (container) {
        // Extract item information
        const itemName = container.querySelector('[class*="name"], [class*="title"], h1, h2, h3')?.textContent?.trim();
        const itemScore = container.querySelector('[class*="score"], [class*="gs"]')?.textContent?.trim();
        const itemType = container.querySelector('[class*="type"], [class*="rarity"]')?.textContent?.trim();
        
        // Create a summary of the item
        const itemInfo = {
          name: itemName || 'Unknown Item',
          score: itemScore || '',
          type: itemType || '',
          url: iframe.contentWindow.location.href
        };
        
        // Log the action
        console.log('Join item action:', itemInfo);
        
        // You can add custom logic here for what happens when joining an item
        // For example, add to a list, copy to clipboard, etc.
        
        // Show visual feedback
        this.showButtonFeedback(button, 'Item Joined!');
        
        // Copy item info to clipboard
        const itemText = `${itemInfo.name}${itemInfo.score ? ` (${itemInfo.score})` : ''}${itemInfo.type ? ` - ${itemInfo.type}` : ''}\n${itemInfo.url}`;
        window.globalCopyToClipboard(itemText, 'nwbuddy-join-item');
        
      } else {
        // Fallback: just copy the current URL
        const currentUrl = iframe.contentWindow.location.href;
        window.globalCopyToClipboard(currentUrl, 'nwbuddy-join-item-url');
        this.showButtonFeedback(button, 'URL Copied!');
      }
      
    } catch (error) {
      console.error('Error handling join item action:', error);
      this.showButtonFeedback(button, 'Error!');
    }
  }

  handleShareAction(button, iframe) {
    try {
      // Find share URL or content
      const container = button.closest('.modal, .dialog, .share-container');
      const urlInput = container?.querySelector('input[value*="nw-buddy.de"], input[value*="http"]');
      
      if (urlInput && urlInput.value) {
        window.globalCopyToClipboard(urlInput.value, 'nwbuddy-share-url');
        this.showButtonFeedback(button, 'URL Copied!');
      } else {
        // Fallback to current URL
        const currentUrl = iframe.contentWindow.location.href;
        window.globalCopyToClipboard(currentUrl, 'nwbuddy-share-url');
        this.showButtonFeedback(button, 'URL Copied!');
      }
      
    } catch (error) {
      console.error('Error handling share action:', error);
      this.showButtonFeedback(button, 'Error!');
    }
  }

  handleAddAction(button, iframe) {
    try {
      // Handle add to list, favorites, etc.
      const currentUrl = iframe.contentWindow.location.href;
      window.globalCopyToClipboard(currentUrl, 'nwbuddy-add-item');
      this.showButtonFeedback(button, 'Added!');
      
    } catch (error) {
      console.error('Error handling add action:', error);
      this.showButtonFeedback(button, 'Error!');
    }
  }

  handleGenericInteractiveAction(button, iframe) {
    try {
      // Generic handling for other interactive buttons
      const currentUrl = iframe.contentWindow.location.href;
      window.globalCopyToClipboard(currentUrl, 'nwbuddy-interactive');
      this.showButtonFeedback(button, 'Action Complete!');
      
    } catch (error) {
      console.error('Error handling generic interactive action:', error);
      this.showButtonFeedback(button, 'Error!');
    }
  }

  setupAlternativeNWBuddyHandlers(iframe) {
    try {
      // For now, just log that we're using alternative approach
      console.log('Using alternative NW Buddy handlers due to CORS restrictions');
      
    } catch (error) {
      console.error('Error setting up alternative NW Buddy handlers:', error);
    }
  }







  showButtonFeedback(button, message) {
    try {
      const originalText = button.innerHTML;
      const originalBackground = button.style.background;
      
      // Show feedback
      button.innerHTML = `✓ ${message}`;
      button.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      button.style.color = 'white';
      
      // Reset after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = originalBackground;
        button.style.color = '';
      }, 2000);
      
    } catch (error) {
      console.error('Error showing button feedback:', error);
    }
  }

  enhanceNWBuddyCopyButton(button, iframe) {
    try {
      // Remove existing click handlers
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Find the text to copy
        let textToCopy = '';
        
        // Look for URL inputs in the same container
        const container = newButton.closest('.modal, .dialog, div, section, article');
        if (container) {
          const urlInput = container.querySelector('input[value*="nw-buddy.de"], input[value*="http"], input[type="url"]');
          if (urlInput && urlInput.value) {
            textToCopy = urlInput.value;
          } else {
            // Look for code snippets
            const codeElement = container.querySelector('code, pre, textarea');
            if (codeElement && codeElement.textContent) {
              textToCopy = codeElement.textContent;
            }
          }
        }
        
        if (textToCopy) {
          // Use the main app's copy function
          window.globalCopyToClipboard(textToCopy, 'nwbuddy-copy');
          
          // Visual feedback
          const originalText = newButton.textContent;
          newButton.textContent = '✓ Copied!';
          newButton.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
          
          setTimeout(() => {
            newButton.textContent = originalText;
            newButton.style.background = '';
          }, 2000);
        }
      });
      
    } catch (error) {
      console.error('Error enhancing NW Buddy copy button:', error);
    }
  }

  async copyShareUrlFromIframe(iframe, copyBtn) {
    try {
      // Try to access iframe content
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Look for the share URL input field
      const shareUrlInput = iframeDoc.querySelector('input[value*="nw-buddy.de/gearsets"], input[value*="ipns"], input[value*="share"]');
      
      if (shareUrlInput && shareUrlInput.value) {
        // Found the share URL, copy it
        this.copyToClipboard(shareUrlInput.value, 'gearset-share-url');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓ Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = 'linear-gradient(135deg, var(--primary-color, #9370db) 0%, var(--primary-dark, #663399) 100%)';
        }, 2000);
        
        return;
      }
      
      // If no share URL found, try to get the current page URL from iframe
      const currentUrl = iframe.contentWindow.location.href;
      if (currentUrl && currentUrl !== iframe.src) {
        this.copyToClipboard(currentUrl, 'iframe-current-url');
        
        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓ Copied!';
        copyBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = 'linear-gradient(135deg, var(--primary-color, #9370db) 0%, var(--primary-dark, #663399) 100%)';
        }, 2000);
        
        return;
      }
      
      // Fallback: copy iframe src
      this.copyToClipboard(iframe.src, 'iframe-src');
      this.showCopyNotification('Could not find share URL, copied base URL instead', 'warning');
      
    } catch (error) {
      // If we can't access iframe content due to CORS, show instructions
      this.showCopyNotification('Right-click the share URL input and select "Copy" to copy the gearset URL', 'info');
    }
  }

  injectCopyScript(iframe) {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Create a script element to inject into the iframe
      const script = iframeDoc.createElement('script');
      script.textContent = `
        // Enhanced copy functionality for iframe
        (function() {
          // Override the default copy behavior for buttons
          function enhanceCopyButtons() {
            const copyButtons = document.querySelectorAll('button[onclick*="copy"], button[onclick*="Copy"], .copy-btn, [data-copy], button:contains("copy"), button:contains("Copy"), [class*="copy"], [id*="copy"]');
            
            copyButtons.forEach(button => {
              // Remove existing click handlers that might interfere
              const newButton = button.cloneNode(true);
              button.parentNode.replaceChild(newButton, button);
              
              newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Try to find the text to copy
                let textToCopy = '';
                
                // Look for common patterns in NW Buddy
                const urlInput = document.querySelector('input[type="url"], input[value*="http"], input[value*="www"], input[value*="nw-buddy.de"]');
                if (urlInput && urlInput.value) {
                  textToCopy = urlInput.value;
                } else {
                  // Look for text in nearby elements
                  const nearbyText = this.closest('div, section, article, .modal, .dialog');
                  if (nearbyText) {
                    const textElements = nearbyText.querySelectorAll('input[value], textarea, [data-url], [data-link], code, pre');
                    for (let elem of textElements) {
                      if (elem.value || elem.textContent) {
                        textToCopy = elem.value || elem.textContent;
                        break;
                      }
                    }
                  }
                }
                
                if (textToCopy) {
                  // Send message to parent window
                  window.parent.postMessage({
                    type: 'COPY_TO_CLIPBOARD',
                    text: textToCopy,
                    source: 'iframe-copy-button'
                  }, '*');
                  
                  // Visual feedback
                  const originalText = this.textContent;
                  this.textContent = '✓ Copied!';
                  this.style.background = '#28a745';
                  this.style.color = 'white';
                  
                  setTimeout(() => {
                    this.textContent = originalText;
                    this.style.background = '';
                    this.style.color = '';
                  }, 2000);
                }
              });
            });
          }
          
          // Add floating copy buttons for URL inputs
          function addFloatingCopyButtons() {
            const urlInputs = document.querySelectorAll('input[type="url"], input[value*="http"], input[value*="www"], input[value*="nw-buddy"], input[value*="gearsets"], input[value*="ipns"]');
            
            urlInputs.forEach(input => {
              // Check if we already added a floating button
              if (input.dataset.floatingCopyAdded) return;
              input.dataset.floatingCopyAdded = 'true';
              
              // Create floating copy button
              const floatingBtn = document.createElement('button');
              floatingBtn.innerHTML = '📋';
              floatingBtn.title = 'Copy Share URL';
              floatingBtn.style.cssText = \`
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                background: #9370db;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                cursor: pointer;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s ease;
              \`;
              
              // Position the button relative to the input
              const inputContainer = input.closest('div, section, article') || input.parentElement;
              if (inputContainer) {
                inputContainer.style.position = 'relative';
                inputContainer.appendChild(floatingBtn);
                
                // Show/hide on hover
                inputContainer.addEventListener('mouseenter', () => {
                  floatingBtn.style.opacity = '1';
                });
                
                inputContainer.addEventListener('mouseleave', () => {
                  floatingBtn.style.opacity = '0';
                });
                
                // Copy on click
                floatingBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const urlToCopy = input.value || input.textContent;
                  if (urlToCopy) {
                    window.parent.postMessage({
                      type: 'COPY_TO_CLIPBOARD',
                      text: urlToCopy,
                      source: 'iframe-floating-copy'
                    }, '*');
                    
                    // Visual feedback
                    floatingBtn.innerHTML = '✓';
                    floatingBtn.style.background = '#28a745';
                    
                    setTimeout(() => {
                      floatingBtn.innerHTML = '📋';
                      floatingBtn.style.background = '#9370db';
                    }, 2000);
                  }
                });
              }
            });
          }
          
          // Special handling for NW Buddy share URLs
          function enhanceNWBuddyShareButtons() {
            // Look for share URL containers
            const shareContainers = document.querySelectorAll('[class*="share"], [id*="share"], [data-testid*="share"]');
            
            shareContainers.forEach(container => {
              const shareInput = container.querySelector('input[value*="nw-buddy.de/gearsets"], input[value*="ipns"]');
              if (shareInput && !shareInput.dataset.enhanced) {
                shareInput.dataset.enhanced = 'true';
                
                // Add a prominent copy button next to the share input
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '📋 Copy Share URL';
                copyBtn.style.cssText = \`
                  background: #9370db;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  padding: 6px 12px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  margin-left: 8px;
                  transition: all 0.2s ease;
                \`;
                
                copyBtn.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const shareUrl = shareInput.value;
                  if (shareUrl) {
                    window.parent.postMessage({
                      type: 'COPY_TO_CLIPBOARD',
                      text: shareUrl,
                      source: 'nwbuddy-share-url'
                    }, '*');
                    
                    // Visual feedback
                    copyBtn.innerHTML = '✓ Copied!';
                    copyBtn.style.background = '#28a745';
                    
                    setTimeout(() => {
                      copyBtn.innerHTML = '📋 Copy Share URL';
                      copyBtn.style.background = '#9370db';
                    }, 2000);
                  }
                });
                
                // Insert after the input
                shareInput.parentNode.insertBefore(copyBtn, shareInput.nextSibling);
              }
            });
          }
          
          // Run immediately and also on DOM changes
          enhanceCopyButtons();
          addFloatingCopyButtons();
          enhanceNWBuddyShareButtons();
          
          // Watch for dynamic content changes
          const observer = new MutationObserver(() => {
            enhanceCopyButtons();
            addFloatingCopyButtons();
            enhanceNWBuddyShareButtons();
          });
          observer.observe(document.body, { childList: true, subtree: true });
          
          // Also enhance any existing copy functions
          if (window.copyToClipboard) {
            const originalCopy = window.copyToClipboard;
            window.copyToClipboard = function(text) {
              window.parent.postMessage({
                type: 'COPY_TO_CLIPBOARD',
                text: text,
                source: 'iframe-original-copy'
              }, '*');
              return originalCopy.apply(this, arguments);
            };
          }
        })();
      `;
      
      iframeDoc.head.appendChild(script);
      console.log('Copy script injected into iframe');
      
    } catch (error) {
      console.log('Could not inject copy script (CORS restriction):', error.message);
      // This is expected for cross-origin iframes
    }
  }

  setupKeyboardShortcuts() {
    // Listen for Ctrl+C (or Cmd+C on Mac) to copy selected text
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        // Check if we're in an iframe tab
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && (activeTab.id === 'tab-nwd' || activeTab.id === 'tab-nwb' || activeTab.id === 'tab-map')) {
          e.preventDefault();
          this.handleKeyboardCopy();
        }
      }
    });
  }

  handleKeyboardCopy() {
    // Try to get selected text from the active iframe
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
      const iframe = activeTab.querySelector('iframe');
      if (iframe) {
        this.copySelectedTextFromIframe(iframe);
        this.hideCopyTips(activeTab);
      }
    }
  }

  setupIframeContextMenu() {
    // Add context menu to iframe containers
    const iframeContainers = document.querySelectorAll('#tab-nwd, #tab-nwb, #tab-map');
    
    iframeContainers.forEach(container => {
      container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showIframeContextMenu(e, container);
        this.hideCopyTips(container);
      });
    });
  }

  hideCopyTips(container) {
    const iframeContainer = container.querySelector('.iframe-container');
    if (iframeContainer) {
      iframeContainer.classList.add('copy-tips-hidden');
    }
  }

  showIframeContextMenu(event, container) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.iframe-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'iframe-context-menu';
    menu.innerHTML = `
      <div class="context-menu-item" data-action="copy-selected">
        📋 Copy Selected Text
      </div>
      <div class="context-menu-item" data-action="copy-url">
        🔗 Copy Page URL
      </div>
      <div class="context-menu-item" data-action="copy-title">
        📄 Copy Page Title
      </div>
    `;

    // Position menu
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.style.zIndex = '10000';

    // Add event listeners
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleContextMenuAction(action, container);
      }
      menu.remove();
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => menu.remove(), { once: true });

    document.body.appendChild(menu);
  }

  handleContextMenuAction(action, container) {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;

    try {
      switch (action) {
        case 'copy-selected':
          // Try to get selected text from iframe
          this.copySelectedTextFromIframe(iframe);
          break;
        case 'copy-url':
          this.copyToClipboard(iframe.src, 'iframe-url');
          break;
        case 'copy-title':
          this.copyToClipboard(iframe.title || 'Iframe Page', 'iframe-title');
          break;
      }
    } catch (error) {
      console.error('Context menu action failed:', error);
      this.showCopyNotification('Failed to copy content', 'error');
    }
  }

  async copySelectedTextFromIframe(iframe) {
    try {
      // Try to access iframe content (may fail due to CORS)
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      const selection = iframeDoc.getSelection();
      
      if (selection && selection.toString().trim()) {
        this.copyToClipboard(selection.toString(), 'iframe-selection');
      } else {
        this.showCopyNotification('No text selected', 'warning');
      }
    } catch (error) {
      // If we can't access iframe content due to CORS, show instructions
      this.showCopyNotification('Right-click and select "Copy" to copy text from iframe', 'info');
    }
  }

  async copyToClipboard(text, source = 'app') {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        this.showCopyNotification(`Copied to clipboard! (${source})`, 'success');
        return;
      }

      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        this.showCopyNotification(`Copied to clipboard! (${source})`, 'success');
      } else {
        throw new Error('execCommand copy failed');
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      this.showCopyNotification('Failed to copy to clipboard', 'error');
    }
  }

  showCopyNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `copy-notification copy-notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--primary-color, #9370db) 0%, var(--primary-dark, #663399) 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px var(--shadow-color, rgba(147, 112, 219, 0.3));
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Helper to fetch and cache the craft mod mapping
let craftModMapCache = null;
async function getCraftModMap() {
  if (craftModMapCache) return craftModMapCache;
  // Use absolute path relative to the project root
  const craftModPath = path.resolve(__dirname, '../../output/nwdb-perks-craftmod-2025-07-06T05-29-13-121Z.json');
  const data = JSON.parse(fs.readFileSync(craftModPath, 'utf-8'));
  // Build a map: perk name -> craftModItem
  const map = {};
  for (const perk of data.perks) {
    if (perk.name && perk.craftModItem) {
      map[perk.name] = perk.craftModItem;
    }
  }
  craftModMapCache = map;
  return map;
}

class NWBuddyScraperUI {
  constructor() {
    this.currentResults = null;
    this.initializeElements();
    this.setupEventListeners();
    this.setupFormValidation();
  }

  initializeElements() {
    // Input elements
    this.urlInput = document.getElementById("url-input");
    this.crawlButton = document.getElementById("crawl-button");

    // Market price elements
    this.includeMarketPricesCheckbox = document.getElementById("include-market-prices");
    this.serverSelect = document.getElementById("server-select");
    this.refreshPricesButton = document.getElementById("refresh-prices-button");

    // Section elements
    this.resultsSection = document.getElementById("results-section");
    this.loadingSection = document.getElementById("loading-section");
    this.errorSection = document.getElementById("error-section");

    // Results elements
    this.resultsContent = document.getElementById("results-content");
    this.saveButton = document.getElementById("save-button");

    // Error elements
    this.errorMessage = document.getElementById("error-message");
    this.retryButton = document.getElementById("retry-button");
  }

  setupEventListeners() {
    // Crawl button click
    this.crawlButton.addEventListener("click", () => {
      this.handleCrawl();
    });

    // Enter key in URL input
    this.urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.handleCrawl();
      }
    });

    // Save button click
    this.saveButton.addEventListener("click", () => {
      this.handleSave();
    });

    // Retry button click
    this.retryButton.addEventListener("click", () => {
      this.handleRetry();
    });

    // URL input validation
    this.urlInput.addEventListener("input", () => {
      this.validateUrl();
    });

    // Market price checkbox
    this.includeMarketPricesCheckbox.addEventListener("change", () => {
      this.handleMarketPricesToggle();
    });

    // Refresh prices button
    this.refreshPricesButton.addEventListener("click", () => {
      this.handleRefreshPrices();
    });

    // Server select change
    this.serverSelect.addEventListener("change", () => {
      this.handleServerChange();
    });
  }

  setupFormValidation() {
    // Initial validation
    this.validateUrl();
  }

  validateUrl() {
    const url = this.urlInput.value.trim();
    const isValid =
      url &&
      (url.includes("nw-buddy.de") ||
        url.includes("nwbuddy.de") ||
        url.startsWith("https://") ||
        url.startsWith("http://"));

    this.crawlButton.disabled = !isValid;

    if (url && !isValid) {
      this.urlInput.style.borderColor = "#dc3545";
    } else {
      this.urlInput.style.borderColor = "";
    }
  }

  async handleCrawl() {
    const url = this.urlInput.value.trim();

    if (!url) {
      this.showError("Please enter a valid NW Buddy URL");
      return;
    }

    this.showLoading();
    this.setButtonLoading(true);

    try {
      console.log("Starting crawl for:", url);
      
      const includeMarketPrices = this.includeMarketPricesCheckbox.checked;
      const serverId = this.serverSelect.value;
      
      const result = await ipcRenderer.invoke("crawl-url", url, includeMarketPrices, serverId);

      if (result.success) {
        this.showResults(result.data);
      } else {
        this.showError(result.error || "Failed to crawl the URL");
      }
    } catch (error) {
      console.error("Crawl error:", error);
      this.showError("An unexpected error occurred: " + error.message);
    } finally {
      this.setButtonLoading(false);
    }
  }

  async handleSave() {
    if (!this.currentResults) {
      return;
    }

    try {
      const result = await ipcRenderer.invoke(
        "show-save-dialog",
        this.currentResults
      );

      if (result.success) {
        this.showNotification("Results saved successfully!", "success");
      }
    } catch (error) {
      console.error("Save error:", error);
      this.showNotification("Failed to save results", "error");
    }
  }

  handleRetry() {
    this.hideAllSections();
    this.urlInput.focus();
  }

  handleMarketPricesToggle() {
    const isChecked = this.includeMarketPricesCheckbox.checked;
    this.serverSelect.disabled = !isChecked;
    this.refreshPricesButton.disabled = !isChecked;
    
    if (isChecked) {
      this.loadServers();
    }
  }

  async handleRefreshPrices() {
    try {
      this.refreshPricesButton.disabled = true;
      this.refreshPricesButton.querySelector('.button-text').textContent = '🔄 Refreshing...';
      
      const serverId = this.serverSelect.value;
      const result = await ipcRenderer.invoke("fetch-market-prices", serverId);
      
      if (result.success) {
        this.showNotification(`Market prices refreshed for ${serverId}!`, "success");
        console.log("Market prices:", result.data);
      } else {
        this.showNotification("Failed to refresh market prices", "error");
      }
    } catch (error) {
      console.error("Refresh prices error:", error);
      this.showNotification("Error refreshing market prices", "error");
    } finally {
      this.refreshPricesButton.disabled = false;
      this.refreshPricesButton.querySelector('.button-text').textContent = '🔄 Refresh Prices';
    }
  }

  handleServerChange() {
    // Could trigger a price refresh or update UI
    console.log("Server changed to:", this.serverSelect.value);
  }

  async loadServers() {
    try {
      const result = await ipcRenderer.invoke("get-servers");
      
      if (result.success) {
        this.populateServerSelect(result.data);
      } else {
        console.error("Failed to load servers:", result.error);
      }
    } catch (error) {
      console.error("Load servers error:", error);
    }
  }

  populateServerSelect(servers) {
    // Clear existing options
    this.serverSelect.innerHTML = '';
    
    // Add server options
    servers.forEach(server => {
      const option = document.createElement('option');
      option.value = server.id;
      option.textContent = `${server.name} (${server.type})`;
      this.serverSelect.appendChild(option);
    });
  }

  showLoading() {
    this.hideAllSections();
    this.loadingSection.classList.add("show");
  }

  async showResults(data, fromModal = false) {
    if (!fromModal) this.hideAllSections();
    this.currentResults = data;
    this.resultsContent.innerHTML = "";
    const nwBuddyData = data.nwBuddyData || { items: [], totalItems: 0, totalPerks: 0 };

    // --- Crafting Materials Calculation ---
    const craftModMap = await getCraftModMap();
    const craftModCounts = {};
    let totalCraftMods = 0;
    // For each item, for each perk, count craft mods
    for (const item of nwBuddyData.items || []) {
      if ((item.isArtifact && item.lastPerk) || (item.gearType && item.gearType.toLowerCase() === 'named' && item.lastPerk)) {
        // Only count the last perk for artifacts and named items
        const craftMod = craftModMap[item.lastPerk.name];
        if (craftMod) {
          craftModCounts[craftMod] = (craftModCounts[craftMod] || 0) + 1;
          totalCraftMods++;
        }
      } else {
        // For other items, count all perks
        for (const perk of item.perks || []) {
          const craftMod = craftModMap[perk];
          if (craftMod) {
            craftModCounts[craftMod] = (craftModCounts[craftMod] || 0) + 1;
            totalCraftMods++;
          }
        }
      }
    }
    // --- Recipe Materials Calculation ---
    const recipeMaterialCounts = {};
    let totalRecipeMaterials = 0;
    for (const item of nwBuddyData.items || []) {
      if (item.craftingMaterials && Array.isArray(item.craftingMaterials)) {
        for (const mat of item.craftingMaterials) {
          // Try to split "80x Prismatic Ingot" into [80, "Prismatic Ingot"]
          const match = mat.match(/^(\d+)x?\s+(.+)$/);
          if (match) {
            const qty = parseInt(match[1], 10);
            const name = match[2].trim();
            recipeMaterialCounts[name] = (recipeMaterialCounts[name] || 0) + qty;
            totalRecipeMaterials += qty;
          } else {
            // fallback: count as 1
            recipeMaterialCounts[mat] = (recipeMaterialCounts[mat] || 0) + 1;
            totalRecipeMaterials += 1;
          }
        }
      }
    }
    // --- End Recipe Materials Calculation ---
    // After calculating craftModCounts and recipeMaterialCounts, also count artifacts and named items
    const artifactCount = (nwBuddyData.items || []).filter(item => item.isArtifact).length;
    const namedCount = (nwBuddyData.items || []).filter(item => item.gearType && item.gearType.toLowerCase() === 'named').length;
    // Special recipe materials
    const goldcursedCoconut = artifactCount + namedCount;
    const darkMatter = artifactCount * 600 + namedCount * 250;
    const chromaticSeal = artifactCount * 1 + namedCount * 3;
    // Add a new section for these special materials
    let specialRecipeMaterialsHTML = `
      <div class="recipemat-summary" style="position:relative;margin-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding: 6px 12px 4px 12px;line-height:1.1;">
          <h3 style="margin:0;font-size:1.05em;">Special Recipe Materials</h3>
        </div>
        <div>
          <ul>
            <li>Goldcursed Coconut: <strong>${this.formatNumber(goldcursedCoconut)}</strong></li>
            <li>Dark Matter: <strong>${this.formatNumber(darkMatter)}</strong></li>
            <li>Chromatic Seal: <strong>${this.formatNumber(chromaticSeal)}</strong></li>
          </ul>
        </div>
      </div>
    `;
    // Build Crafting Materials HTML
    let craftingMaterialsHTML = '';
    let recipeMaterialsSummaryHTML = '';
    if (Object.keys(craftModCounts).length > 0 || Object.keys(recipeMaterialCounts).length > 0) {
      // Add special recipe materials to the recipeMaterialCounts object
      recipeMaterialCounts['Goldcursed Coconut'] = goldcursedCoconut;
      recipeMaterialCounts['Dark Matter'] = darkMatter;
      recipeMaterialCounts['Chromatic Seal'] = chromaticSeal;
      craftingMaterialsHTML = `
        <div class="craft-summary-row" style="margin-bottom: 32px;">
          <div class="craftmod-summary">
            <div style="display:flex;align-items:center;justify-content:space-between;padding: 6px 12px 4px 12px;line-height:1.1;">
              <h3 style="margin:0;font-size:1.15em;">Crafting Materials</h3>
              <button class="collapse-btn" data-section="crafting-materials" style="background:none;border:none;font-size:1.2em;cursor:pointer;outline:none;color:#ffb300;">▼</button>
            </div>
            <div class="collapsible-section" data-section="crafting-materials">
            <ul>
              ${Object.entries(craftModCounts)
                .map(([mod, count]) => `<li>${this.escapeHtml(mod)}: ${count}</li>`)
                .join('')}
            </ul>
              <p><strong>Total Craft Mods Needed:</strong> ${this.formatNumber(totalCraftMods)}</p>
            </div>
          </div>
          <div class="recipemat-summary">
            <div style="display:flex;align-items:center;justify-content:space-between;padding: 6px 12px 4px 12px;line-height:1.1;">
              <h3 style="margin:0;font-size:1.15em;">Recipe Materials</h3>
              <button class="collapse-btn" data-section="recipe-materials" style="background:none;border:none;font-size:1.2em;cursor:pointer;outline:none;color:#ffb300;">▼</button>
            </div>
            <div class="collapsible-section" data-section="recipe-materials">
            <ul>
              ${Object.entries(recipeMaterialCounts)
                  .map(([mat, count]) => `<li>${this.escapeHtml(mat)}: ${Number(count).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>`)
                .join('')}
            </ul>
              <p><strong>Total Recipe Materials Needed:</strong> ${Number(totalRecipeMaterials).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      `;
    }
    // --- End Crafting Materials Calculation ---

    // --- Market Prices and Crafting Costs ---
    let marketPricesHTML = '';
    let craftingCostsHTML = '';
    
    if (data.marketPrices && !data.marketPrices.error) {
      const prices = data.marketPrices.prices || {};
      const costs = data.craftingCosts || {};
      
      if (Object.keys(prices).length > 0) {
        marketPricesHTML = `
          <div class="market-prices-section">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <h3 style="margin:0;">💰 Market Prices</h3>
              <button class="collapse-btn" data-section="market-prices" style="background:none;border:none;font-size:1.3em;cursor:pointer;outline:none;color:#ffb300;">▼</button>
            </div>
            <div class="collapsible-section" data-section="market-prices">
            <div class="prices-grid">
              ${Object.entries(prices).map(([item, price]) => 
                `<div class="price-item">
                  <span class="item-name">${this.escapeHtml(item)}</span>
                    <span class="price-value">${this.formatNumber(price)} gold</span>
                    <button class="delete-price-btn" data-item="${this.escapeHtml(item)}" title="Delete" style="margin-left:8px;background:none;border:none;color:#dc3545;font-size:1.2em;cursor:pointer;vertical-align:middle;">🗑️</button>
                </div>`
              ).join('')}
              </div>
            </div>
          </div>
        `;
      }
      
      if (Object.keys(costs).length > 0 || Object.keys(prices).length > 0) {
        // Build a breakdown for all market prices
        let breakdownRows = [];
        let totalCost = 0;
        // Get all referenced quantities
        const allQuantities = { ...craftModCounts, ...recipeMaterialCounts };
        for (const [item, price] of Object.entries(prices)) {
          const qty = allQuantities[item] || 1;
          const itemTotal = qty * price;
          totalCost += itemTotal;
          breakdownRows.push(`<div class="cost-item"><span class="item-name">${this.escapeHtml(item)} (${qty} × ${this.formatNumber(price)})</span><span class="cost-value">= ${this.formatNumber(itemTotal)} gold</span></div>`);
        }
        craftingCostsHTML = `
          <div class="crafting-costs-section">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <h3 style="margin:0;">💸 Crafting Costs</h3>
              <button class="collapse-btn" data-section="crafting-costs" style="background:none;border:none;font-size:1.3em;cursor:pointer;outline:none;color:#ffb300;">▼</button>
            </div>
            <div class="collapsible-section" data-section="crafting-costs">
            <div class="costs-list">
                ${breakdownRows.join('')}
            </div>
            <div class="total-cost">
                <strong>Total Crafting Cost: ${this.formatNumber(totalCost)} gold</strong>
              </div>
            </div>
          </div>
        `;
      }
    } else if (data.marketPrices && data.marketPrices.error) {
      marketPricesHTML = `
        <div class="market-prices-section error">
          <h3>❌ Market Prices Error</h3>
          <p>${this.escapeHtml(data.marketPrices.error)}</p>
        </div>
      `;
    }

    // Add rarity label styles
    const rarityLabelStyles = `
      <style>
        .item-rarity { margin-left: 8px; padding: 2px 8px; border-radius: 6px; font-size: 0.9em; font-weight: bold; vertical-align: middle; }
        .rarity-artifact { background: #6f42c1; color: #fff; }
        .rarity-legendary { background: #ff9800; color: #fff; }
        .rarity-epic { background: #9c27b0; color: #fff; }
        .rarity-rare { background: #2196f3; color: #fff; }
        .rarity-uncommon { background: #4caf50; color: #fff; }
        .rarity-common { background: #bdbdbd; color: #222; }
        
        .market-prices-section, .crafting-costs-section {
          background: rgba(255, 140, 0, 0.1);
          border: 1px solid rgba(255, 140, 0, 0.3);
          border-radius: 10px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .market-prices-section h3, .crafting-costs-section h3 {
          color: #ff8c00;
          margin-bottom: 15px;
        }
        
        .prices-grid, .costs-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
        }
        
        .price-item, .cost-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
          border: 1px solid rgba(255, 140, 0, 0.2);
        }
        
        .price-value, .cost-value {
          font-weight: bold;
          color: #ff8c00;
        }
        
        .total-cost {
          margin-top: 15px;
          padding: 10px;
          background: rgba(255, 140, 0, 0.2);
          border-radius: 6px;
          text-align: center;
          color: #ff8c00;
        }
        
        .market-prices-section.error {
          background: rgba(220, 53, 69, 0.1);
          border-color: rgba(220, 53, 69, 0.3);
        }
        
        .market-prices-section.error h3 {
          color: #dc3545;
        }
      </style>
    `;

    // Add gear type label styles
    const gearTypeLabelStyles = `
      <style>
        .item-gear-type { margin-left: 8px; padding: 2px 8px; border-radius: 6px; font-size: 0.9em; font-weight: bold; vertical-align: middle; background: #444; color: #fff; }
        .gear-type-artifact { background: #6f42c1; }
        .gear-type-named { background: #ff9800; }
        .gear-type-legendary { background: #9c27b0; }
        .gear-type-epic { background: #2196f3; }
        .gear-type-rare { background: #4caf50; }
        .gear-type-uncommon { background: #bdbdbd; color: #222; }
        .gear-type-common { background: #eee; color: #222; }
        .item-recipe-materials {
          background: #23200e;
          border-radius: 8px;
          margin: 16px 0 0 0;
          padding: 18px 28px 18px 28px;
          color: #ffe;
          border: 1px solid #bfa32a;
        }
        .item-recipe-materials h5 {
          margin: 0 0 14px 0;
          color: #ffe066;
          font-size: 1.05em;
          font-weight: bold;
        }
        .item-recipe-materials ul {
          margin: 0;
          padding-left: 32px;
          font-size: 1em;
        }
        .item-recipe-materials li {
          color: #fffbe6;
          font-size: 1em;
          margin-bottom: 4px;
        }
        .item-materials-row {
          display: flex;
          flex-direction: row;
          gap: 32px;
          margin: 16px 0 0 0;
          align-items: stretch;
        }
        .item-recipe-materials, .item-craftmods {
          background: #23200e;
          border-radius: 8px;
          padding: 18px 28px 18px 28px;
          color: #ffe;
          border: 1px solid #bfa32a;
          font-family: inherit;
          font-size: 1em;
          flex: 1 1 0;
          width: 0;
          box-sizing: border-box;
          height: 100%;
          min-height: 120px;
          margin: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.10);
        }
        .item-craftmods {
          border: 1px solid #6fa3c1;
          margin-left: 0;
        }
        .item-recipe-materials h5, .item-craftmods h5 {
          margin: 0 0 14px 0;
          font-size: 1.05em;
          font-weight: bold;
        }
        .item-craftmods h5 {
          color: #6fd6ff;
        }
        .item-recipe-materials ul, .item-craftmods ul {
          margin: 0;
          padding-left: 32px;
          font-size: 1em;
        }
        .item-recipe-materials li, .item-craftmods li {
          color: #fffbe6;
          font-size: 1em;
          margin-bottom: 4px;
        }
        .item-craftmods li {
          color: #e0f7ff;
          font-size: 1em;
          margin-bottom: 4px;
        }
        .craft-summary-row {
          display: flex;
          flex-direction: row;
          gap: 32px;
          margin-top: 24px;
          align-items: stretch;
        }
        .craftmod-summary, .recipemat-summary {
          color: #f8f9fa;
          background: #222;
          border-radius: 8px;
          padding: 16px;
          flex: 1 1 0;
          width: 0;
          box-sizing: border-box;
          height: 100%;
          min-height: 120px;
          margin: 0;
        }
        .craftmod-summary h3, .recipemat-summary h3 {
          color: #fff;
        }
        .craftmod-summary ul, .recipemat-summary ul {
          margin: 0 0 8px 0;
          padding-left: 20px;
        }
        .craftmod-summary li, .recipemat-summary li {
          color: #fff;
        }
        .craftmod-summary {
          border: 1px solid #3a8fd6;
        }
        .recipemat-summary {
          border: 1px solid #ffe066;
        }
      </style>
    `;

    // Create results HTML with items and their perks
    const resultsHTML = `
      ${rarityLabelStyles}
      ${gearTypeLabelStyles}
      
      ${marketPricesHTML}
      ${craftingCostsHTML}
      ${craftingMaterialsHTML}
      
      <div class="items-results">
        <div class="item-list">
          ${
            nwBuddyData.items && nwBuddyData.items.length > 0
              ? nwBuddyData.items
                  .map(
                    (item) => {
                      if (item.isArtifact || (item.gearType && item.gearType.toLowerCase() === 'named')) {
                        console.log('DEBUG ITEM:', item);
                      }
                      const rarity = this.getRarityLabel(item);
                      const showGearType = !(item.isArtifact && item.gearType && item.gearType.toLowerCase() === 'artifact');
                      return `
                    <div class="item-card ${item.isArtifact ? 'artifact-item' : ''}">
                      <div class="item-header" style="display:flex;align-items:center;">
                        <h4 class="item-name" style="margin-right:12px;">
                          ${item.isArtifact ? '🏛️' : '📦'} ${this.escapeHtml(item.name)}
                        </h4>
                        <select class="rarity-dropdown" data-item-index="${nwBuddyData.items.indexOf(item)}" style="margin-right:12px;">
                            <option value="crafting"${item.gearType && item.gearType.toLowerCase() === 'crafting' ? ' selected' : ''}>Crafting</option>
                            <option value="named"${item.gearType && item.gearType.toLowerCase() === 'named' ? ' selected' : ''}>Named</option>
                            <option value="artifact"${item.isArtifact ? ' selected' : ''}>Artifact</option>
                          </select>
                        <div style="flex:1"></div>
                        <span class="item-cost" style="min-width:140px;text-align:right;font-weight:bold;color:#ffb300;font-size:1.1em;vertical-align:middle;">${(() => {
                          let itemCost = 0;
                          if (item.craftingMaterials && Array.isArray(item.craftingMaterials)) {
                            for (const mat of item.craftingMaterials) {
                              const match = mat.match(/^(\d+)x?\s+(.+)$/);
                              if (match) {
                                const qty = parseInt(match[1], 10);
                                const name = match[2].trim();
                                const price = (data.marketPrices && data.marketPrices.prices && data.marketPrices.prices[name]) || 0;
                                itemCost += qty * price;
                              } else {
                                const price = (data.marketPrices && data.marketPrices.prices && data.marketPrices.prices[mat]) || 0;
                                itemCost += price;
                              }
                            }
                          }
                          if (item.perkDetails && Array.isArray(item.perkDetails)) {
                            for (const perk of item.perkDetails) {
                              if (perk.craftModUrl) {
                                const craftModName = (() => {
                                  const match = perk.craftModUrl.match(/\/([^\/]+)$/);
                                  return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : perk.name;
                                })();
                                const price = (data.marketPrices && data.marketPrices.prices && data.marketPrices.prices[craftModName]) || 0;
                                itemCost += price;
                              }
                            }
                          }
                          return itemCost > 0 ? `Cost: ${this.formatNumber(itemCost)} gold` : '';
                        })()}</span>
                        <span class="perk-count" style="margin-left:12px;">${item.perks.length} perks</span>
                      </div>
                      <div class="item-perks">
                        ${
                          item.perkDetails && item.perkDetails.length > 0
                            ? item.perkDetails
                                .map((perkDetail, idx) => {
                                  // For artifacts/named, highlight last perk
                                  const isLast = idx === item.perkDetails.length - 1 && (item.isArtifact || (item.gearType && item.gearType.toLowerCase() === 'named'));
                                  const perkClass = perkDetail.isGemSlot ? 'perk-tag gem-slot' : isLast ? 'perk-tag last-perk' : 'perk-tag';
                                  const perkIcon = perkDetail.isGemSlot ? '💎' : '⚡';
                                  const perkText = this.escapeHtml(perkDetail.name);
                                  // Make every perk clickable if it has a url
                                  if (perkDetail.url) {
                                    return `<a href="${perkDetail.url}" target="_blank" class="${perkClass}">${perkIcon} ${perkText}</a>`;
                                  } else if (perkDetail.craftModUrl) {
                                    return `<a href="${perkDetail.craftModUrl}" target="_blank" class="${perkClass}">${perkIcon} ${perkText}</a>`;
                                  } else {
                                    return `<span class="${perkClass}">${perkIcon} ${perkText}</span>`;
                                  }
                                })
                                .join("")
                            : '<span class="no-perks">No perks found</span>'
                        }
                      </div>
                      ${(item.isArtifact || (item.gearType && item.gearType.toLowerCase() === 'named')) ? `
                      <div class="last-perk-info">
                        <small>Added perk: <strong>${this.escapeHtml(item.perkDetails[item.perkDetails.length-1]?.name || '')}</strong></small>
                      </div>
                      ` : ''}
                      ${(!(item.isArtifact || (item.gearType && item.gearType.toLowerCase() === 'named')) && ((item.craftingMaterials && item.craftingMaterials.length > 0) || (item.perks || []).some(perk => craftModMap[perk]))) ? `
                      <div class="item-materials-row">
                        ${(item.craftingMaterials && item.craftingMaterials.length > 0) ? `
                          <div class="item-recipe-materials">
                            <h5>Recipe Materials</h5>
                            <ul>
                              ${item.craftingMaterials.map(mat => `<li>${this.escapeHtml(mat)}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                        ${(() => {
                          const craftMods = (item.perks || [])
                            .map(perk => craftModMap[perk])
                            .filter(Boolean);
                          if (craftMods.length === 0) return '';
                          return `
                            <div class="item-craftmods">
                              <h5>Craft Mods</h5>
                              <ul>
                                ${craftMods.map(mod => `<li>${this.escapeHtml(mod)}</li>`).join('')}
                              </ul>
                            </div>
                          `;
                        })()}
                      </div>
                    ` : ''}
                    </div>
                  `;
                    }
                  )
                  .join("")
              : '<div class="no-items">No items found</div>'
          }
        </div>
      </div>
    `;

    this.resultsContent.innerHTML = resultsHTML;
    // Add event listeners for rarity dropdowns
    this.resultsContent.querySelectorAll('.rarity-dropdown').forEach(dropdown => {
      dropdown.addEventListener('change', (e) => {
        const idx = parseInt(dropdown.getAttribute('data-item-index'), 10);
        const value = dropdown.value;
        const itemCard = dropdown.closest('.item-card');
        if (!itemCard) return;
        // Hide or show recipe materials based on selection
        const recipeMaterials = itemCard.querySelector('.item-recipe-materials');
        if (recipeMaterials) {
          if (value === 'named' || value === 'artifact') {
            recipeMaterials.style.display = 'none';
          } else {
            recipeMaterials.style.display = '';
          }
        }
        // Hide or show Craft Mods
        const craftMods = itemCard.querySelector('.item-craftmods');
        if (craftMods) {
          if (value === 'named' || value === 'artifact') {
            craftMods.style.display = 'none';
          } else {
            craftMods.style.display = '';
          }
        }
        // Hide or show Added perk
        let lastPerkInfo = itemCard.querySelector('.last-perk-info');
        if (!lastPerkInfo && (value === 'named' || value === 'artifact')) {
          // Create the Added perk section if it doesn't exist
          const perks = itemCard.querySelectorAll('.item-perks .perk-tag');
          if (perks.length > 0) {
            const lastPerkName = perks[perks.length - 1].textContent.replace(/^⚡\s*/, '').replace(/^💎\s*/, '');
            lastPerkInfo = document.createElement('div');
            lastPerkInfo.className = 'last-perk-info';
            lastPerkInfo.innerHTML = `<small>Added perk: <strong>${lastPerkName}</strong></small>`;
            itemCard.appendChild(lastPerkInfo);
          }
        } else if (lastPerkInfo) {
          if (value === 'named' || value === 'artifact') {
            lastPerkInfo.style.display = '';
          } else {
            lastPerkInfo.style.display = 'none';
          }
        }
      });
    });
    this.saveButton.disabled = false;
    this.resultsSection.classList.add("show");
    this.showNotification(
      `Found ${nwBuddyData.totalItems} items with ${nwBuddyData.totalPerks} unique perks${nwBuddyData.artifactCount > 0 ? ` (${nwBuddyData.artifactCount} artifacts)` : ''}!`,
      "success"
    );
    // Add info banner above the market price table
    setTimeout(() => {
      const marketBox = this.resultsContent.querySelector('.market-prices-section');
      if (!marketBox) return;
      // Insert info banner if not present
      if (!document.getElementById('market-edit-tip')) {
        const tip = document.createElement('div');
        tip.id = 'market-edit-tip';
        tip.textContent = 'Tip: Click any price below to edit it!';
        tip.style.background = '#fff3cd';
        tip.style.color = '#b85c00';
        tip.style.border = '2px solid #ffb300';
        tip.style.borderRadius = '8px';
        tip.style.padding = '8px 16px';
        tip.style.marginBottom = '16px';
        tip.style.fontWeight = 'bold';
        tip.style.fontSize = '1.05em';
        tip.style.textAlign = 'center';
        marketBox.parentElement.insertBefore(tip, marketBox);
      }
      const ui = this;
      marketBox.querySelectorAll('.price-item').forEach(itemDiv => {
        const nameSpan = itemDiv.querySelector('.item-name');
        let priceValue = itemDiv.querySelector('.price-value');
        if (!nameSpan || !priceValue) return;
        // Add tooltip and hover effect
        priceValue.title = 'Click to edit price';
        priceValue.style.transition = 'background 0.2s, box-shadow 0.2s';
        itemDiv.onmouseenter = () => {
          priceValue.style.background = 'rgba(255, 140, 0, 0.12)';
          priceValue.style.boxShadow = '0 0 0 2px #ffb300';
          priceValue.style.cursor = 'pointer';
        };
        itemDiv.onmouseleave = () => {
          priceValue.style.background = '';
          priceValue.style.boxShadow = '';
          priceValue.style.cursor = '';
        };
        function attachClick(span) {
          span.style.cursor = 'pointer';
          span.title = 'Click to edit price';
          span.addEventListener('click', () => {
            const oldValue = parseFloat(span.textContent);
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min = '0';
            input.value = oldValue;
            input.style.width = '70px';
            input.style.fontWeight = 'bold';
            input.style.color = '#222';
            input.style.background = '#fff';
            input.style.border = '3px solid #ffb300';
            input.style.borderRadius = '8px';
            input.style.padding = '2px 8px';
            input.style.boxShadow = '0 0 6px 2px #ffe066';
            input.style.fontSize = '1.1em';
            input.style.outline = 'none';
            span.replaceWith(input);
            input.focus();
            input.select();
            const saveEdit = async () => {
              let newValue = parseFloat(input.value);
              if (isNaN(newValue) || newValue < 0) newValue = oldValue;
              // Update UI
              const newSpan = document.createElement('span');
              newSpan.className = 'price-value';
              newSpan.textContent = `${newValue.toFixed(2)} gold`;
              newSpan.style.fontWeight = 'bold';
              newSpan.style.color = '#ff8c00';
              attachClick(newSpan);
              input.replaceWith(newSpan);
              // Update in-memory data
              if (ui.currentResults && ui.currentResults.marketPrices && ui.currentResults.marketPrices.prices) {
                ui.currentResults.marketPrices.prices[nameSpan.textContent.trim()] = newValue;
                // Save persistently
                await ipcRenderer.invoke('save-market-prices', ui.currentResults.marketPrices.prices);
                // Recalculate crafting costs
                const gearData = ui.currentResults;
                const result = await ipcRenderer.invoke('calculate-crafting-costs', gearData, ui.currentResults.marketPrices.prices);
                if (result && result.success && result.data) {
                  ui.currentResults.craftingCosts = result.data;
                  ui.showResults(ui.currentResults, true);
                }
              }
            };
            input.addEventListener('blur', saveEdit);
            input.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                input.blur();
              } else if (e.key === 'Escape') {
                input.replaceWith(span);
              }
            });
          });
        }
        attachClick(priceValue);
      });
      // Add 'Add More' box at the end of the market prices grid
      const pricesGrid = marketBox.querySelector('.prices-grid');
      if (pricesGrid && !pricesGrid.querySelector('.add-more-box')) {
        const addBox = document.createElement('div');
        addBox.className = 'add-more-box';
        addBox.style.display = 'flex';
        addBox.style.alignItems = 'center';
        addBox.style.justifyContent = 'center';
        addBox.style.border = '2px dashed #ffb300';
        addBox.style.borderRadius = '8px';
        addBox.style.height = '40px';
        addBox.style.minWidth = '120px';
        addBox.style.color = '#ffb300';
        addBox.style.fontWeight = 'bold';
        addBox.style.fontSize = '1.1em';
        addBox.style.cursor = 'pointer';
        addBox.style.background = 'rgba(255, 255, 255, 0.04)';
        addBox.style.transition = 'background 0.2s, border-color 0.2s';
        addBox.innerHTML = '<span style="font-size:1.3em;margin-right:6px;">+</span> Add More';
        addBox.title = 'Add a custom material or craft mod price';
        addBox.onmouseenter = () => {
          addBox.style.background = 'rgba(255, 179, 0, 0.08)';
          addBox.style.borderColor = '#ff8c00';
        };
        addBox.onmouseleave = () => {
          addBox.style.background = 'rgba(255, 255, 255, 0.04)';
          addBox.style.borderColor = '#ffb300';
        };
        addBox.onclick = async (e) => {
          e.stopPropagation();
          // Prevent reopening if already open
          if (addBox.classList.contains('prompt-open')) return;
          addBox.classList.add('prompt-open');
          addBox.innerHTML = '';
          addBox.style.flexDirection = 'column';
          const promptContainer = document.createElement('div');
          promptContainer.tabIndex = -1;
          promptContainer.style.display = 'flex';
          promptContainer.style.flexDirection = 'column';
          promptContainer.style.alignItems = 'center';
          promptContainer.style.width = '100%';
          const nameInput = document.createElement('input');
          nameInput.type = 'text';
          nameInput.placeholder = 'Material Name';
          nameInput.style.margin = '2px 0 6px 0';
          nameInput.style.padding = '2px 8px';
          nameInput.style.border = '2px solid #ffb300';
          nameInput.style.borderRadius = '6px';
          nameInput.style.fontSize = '1em';
          nameInput.style.width = '110px';
          nameInput.style.outline = 'none';

          // --- Autocomplete for craft mods (fixed) ---
          // Use getCraftModMap() directly to get all craft mods
          let craftModCounts = {};
          let craftModNames = [];
          const craftModMap = await getCraftModMap();
          if (craftModMap) {
            // Use all unique craft mod names from the map values
            craftModNames = Array.from(new Set(Object.values(craftModMap)));
            // Optionally, count occurrences in current build for display
            if (ui.currentResults && ui.currentResults.nwBuddyData) {
              const items = ui.currentResults.nwBuddyData.items || [];
              for (const item of items) {
                if ((item.isArtifact && item.lastPerk) || (item.gearType && item.gearType.toLowerCase() === 'named' && item.lastPerk)) {
                  const craftMod = craftModMap[item.lastPerk.name];
                  if (craftMod) {
                    craftModCounts[craftMod] = (craftModCounts[craftMod] || 0) + 1;
                  }
                } else {
                  for (const perk of item.perks || []) {
                    const craftMod = craftModMap[perk];
                    if (craftMod) {
                      craftModCounts[craftMod] = (craftModCounts[craftMod] || 0) + 1;
                    }
                  }
                }
              }
            }
          }

          // Create autocomplete dropdown
          const autocompleteBox = document.createElement('div');
          autocompleteBox.style.position = 'absolute';
          autocompleteBox.style.background = '#fff';
          autocompleteBox.style.border = '1.5px solid #ffb300';
          autocompleteBox.style.borderRadius = '6px';
          autocompleteBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          autocompleteBox.style.zIndex = '1001';
          autocompleteBox.style.display = 'none';
          autocompleteBox.style.maxHeight = '140px';
          autocompleteBox.style.overflowY = 'auto';
          autocompleteBox.style.minWidth = '110px';
          autocompleteBox.style.fontSize = '1em';
          autocompleteBox.style.left = '0';
          autocompleteBox.style.top = '36px';
          autocompleteBox.style.padding = '2px 0';

          function showAutocomplete(filtered) {
            autocompleteBox.innerHTML = '';
            if (filtered.length === 0) {
              autocompleteBox.style.display = 'none';
              return;
            }
            filtered.forEach(name => {
              const option = document.createElement('div');
              option.textContent = craftModCounts[name] ? `${name} (${craftModCounts[name]})` : name;
              option.style.padding = '4px 10px';
              option.style.cursor = 'pointer';
              option.onmouseenter = () => option.style.background = '#ffe066';
              option.onmouseleave = () => option.style.background = '';
              option.onclick = () => {
                nameInput.value = name;
                autocompleteBox.style.display = 'none';
                priceInput.focus();
              };
              autocompleteBox.appendChild(option);
            });
            autocompleteBox.style.display = 'block';
          }

          nameInput.addEventListener('input', () => {
            const val = nameInput.value.trim().toLowerCase();
            if (!val) {
              showAutocomplete(craftModNames);
              return;
            }
            const filtered = craftModNames.filter(n => n.toLowerCase().includes(val));
            showAutocomplete(filtered);
          });
          nameInput.addEventListener('focus', () => {
            if (nameInput.value.trim() === '') {
              showAutocomplete(craftModNames);
            } else {
              const val = nameInput.value.trim().toLowerCase();
              const filtered = craftModNames.filter(n => n.toLowerCase().includes(val));
              showAutocomplete(filtered);
            }
          });
          nameInput.addEventListener('blur', () => {
            setTimeout(() => autocompleteBox.style.display = 'none', 120);
          });

          promptContainer.style.position = 'relative';
          promptContainer.appendChild(nameInput);
          promptContainer.appendChild(autocompleteBox);

          const priceInput = document.createElement('input');
          priceInput.type = 'number';
          priceInput.step = '0.01';
          priceInput.min = '0';
          priceInput.placeholder = 'Price';
          priceInput.style.margin = '2px 0 6px 0';
          priceInput.style.padding = '2px 8px';
          priceInput.style.border = '2px solid #ffb300';
          priceInput.style.borderRadius = '6px';
          priceInput.style.fontSize = '1em';
          priceInput.style.width = '80px';
          priceInput.style.outline = 'none';
          const submitBtn = document.createElement('button');
          submitBtn.textContent = 'Add';
          submitBtn.style.background = '#ffb300';
          submitBtn.style.color = '#222';
          submitBtn.style.border = 'none';
          submitBtn.style.borderRadius = '6px';
          submitBtn.style.padding = '2px 12px';
          submitBtn.style.fontWeight = 'bold';
          submitBtn.style.cursor = 'pointer';
          submitBtn.style.fontSize = '1em';
          submitBtn.style.marginTop = '2px';
          // Helper to reset to original state
          function resetAddBox() {
            addBox.innerHTML = '<span style="font-size:1.3em;margin-right:6px;">+</span> Add More';
            addBox.style.flexDirection = 'row';
            addBox.classList.remove('prompt-open');
            document.removeEventListener('mousedown', handleDocumentMouseDown, true);
          }
          // Focusout logic: only reset if focus leaves the whole prompt
          function handlePromptFocusOut(e) {
            if (!promptContainer.contains(e.relatedTarget)) {
              resetAddBox();
            }
          }
          promptContainer.addEventListener('focusout', handlePromptFocusOut);

          // Only focus nameInput on first open
          nameInput.focus();

          // Refined mousedown handler
          function handleDocumentMouseDown(e) {
            if (!promptContainer.contains(e.target)) {
              resetAddBox();
            }
          }
          setTimeout(() => {
            document.addEventListener('mousedown', handleDocumentMouseDown, true);
          }, 0);

          nameInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') resetAddBox(); });
          priceInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') resetAddBox(); });
          submitBtn.addEventListener('keydown', (e) => { if (e.key === 'Escape') resetAddBox(); });
          submitBtn.onclick = async (e) => {
            e.stopPropagation();
            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value);
            if (!name || isNaN(price) || price < 0) {
              nameInput.style.borderColor = priceInput.style.borderColor = '#dc3545';
              return;
            }
            // Add to market prices and update
            if (ui.currentResults && ui.currentResults.marketPrices && ui.currentResults.marketPrices.prices) {
              ui.currentResults.marketPrices.prices[name] = price;
              await ipcRenderer.invoke('save-market-prices', ui.currentResults.marketPrices.prices);
              const gearData = ui.currentResults;
              const result = await ipcRenderer.invoke('calculate-crafting-costs', gearData, ui.currentResults.marketPrices.prices);
              if (result && result.success && result.data) {
                ui.currentResults.craftingCosts = result.data;
                ui.showResults(ui.currentResults, true);
              }
            }
          };
          promptContainer.appendChild(priceInput);
          promptContainer.appendChild(submitBtn);
          addBox.appendChild(promptContainer);
        };
        pricesGrid.appendChild(addBox);
      }
    }, 100);
    // Remove inline editing logic for market prices (no longer needed)
    // Add delete button event listeners
    setTimeout(() => {
      const marketBox = this.resultsContent.querySelector('.market-prices-section');
      if (!marketBox) return;
      marketBox.querySelectorAll('.delete-price-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const item = btn.getAttribute('data-item');
          if (item && this.currentResults && this.currentResults.marketPrices && this.currentResults.marketPrices.prices) {
            delete this.currentResults.marketPrices.prices[item];
            await ipcRenderer.invoke('save-market-prices', this.currentResults.marketPrices.prices);
            // Recalculate crafting costs
            const gearData = this.currentResults;
            const result = await ipcRenderer.invoke('calculate-crafting-costs', gearData, this.currentResults.marketPrices.prices);
            if (result && result.success && result.data) {
              this.currentResults.craftingCosts = result.data;
              this.showResults(this.currentResults, true);
            }
          }
        });
      });
    }, 100);

    // After rendering, add JS to handle collapse/expand
    setTimeout(() => {
      document.querySelectorAll('.collapse-btn').forEach(btn => {
        btn.onclick = function() {
          const section = btn.getAttribute('data-section');
          const content = btn.closest('div').parentElement.querySelector('.collapsible-section[data-section="' + section + '"]');
          if (!content) return;
          if (content.style.display === 'none') {
            content.style.display = '';
            btn.textContent = '▼';
          } else {
            content.style.display = 'none';
            btn.textContent = '▲';
          }
        };
      });
    }, 100);
  }

  showError(message) {
    this.hideAllSections();
    this.errorMessage.textContent = message;
    this.errorSection.classList.add("show");
  }

  hideAllSections() {
    this.resultsSection.classList.remove("show");
    this.loadingSection.classList.remove("show");
    this.errorSection.classList.remove("show");
  }

  setButtonLoading(isLoading) {
    if (isLoading) {
      this.crawlButton.classList.add("loading");
      this.crawlButton.disabled = true;
    } else {
      this.crawlButton.classList.remove("loading");
      this.validateUrl(); // Re-enable based on validation
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: "1000",
      opacity: "0",
      transform: "translateX(100%)",
      transition: "all 0.3s ease",
      maxWidth: "300px",
    });

    // Set background color based on type
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      info: "#17a2b8",
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    // Add to DOM
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateX(0)";
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  formatNumber(n) {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getRarityLabel(item) {
    if (item.isArtifact) return { label: 'Artifact', class: 'rarity-artifact' };
    if (item.rarity === 'legendary') return { label: 'Legendary', class: 'rarity-legendary' };
    if (item.rarity === 'epic') return { label: 'Epic', class: 'rarity-epic' };
    if (item.rarity === 'rare') return { label: 'Rare', class: 'rarity-rare' };
    if (item.rarity === 'uncommon') return { label: 'Uncommon', class: 'rarity-uncommon' };
    if (item.rarity === 'common') return { label: 'Common', class: 'rarity-common' };
    return null;
  }

  getGearTypeLabel(item) {
    if (item.gearType) {
      let label = item.gearType;
      if (label.toLowerCase() === 'store') label = 'Crafting';
      const typeClass = 'gear-type-' + label.toLowerCase().replace(/\s+/g, '-');
      return `<span class="item-gear-type ${typeClass}">${this.escapeHtml(label)}</span>`;
    }
    return '';
  }
}

// --- DRAGGABLE TABS LOGIC ---
function saveTabOrder(order) {
  localStorage.setItem('tabOrder', JSON.stringify(order));
}
function loadTabOrder() {
  try {
    return JSON.parse(localStorage.getItem('tabOrder'));
  } catch {
    return null;
  }
}
function reorderTabContents(tabOrder) {
  const mainContent = document.querySelector('.main-content');
  const tabBar = document.querySelector('.tab-bar');
  // Move tab-content divs in the same order as tab buttons
  tabOrder.forEach(tab => {
    const tabContent = document.getElementById('tab-' + tab);
    if (tabContent) {
      mainContent.appendChild(tabContent);
    }
  });
}
// --- END DRAGGABLE TABS LOGIC ---

// --- SCHEDULE MAKER FUNCTIONALITY ---
class ScheduleMaker {
  constructor() {
    this.schedule = {
      today: {}
    };
    this.currentRegion = 'east';
    this.initializeScheduleMaker();
  }

  initializeScheduleMaker() {
    this.loadSchedule();
    this.setupEventListeners();
    this.renderSchedule();
  }

  setupEventListeners() {
    // Custom event modal
    document.getElementById('add-custom-event').addEventListener('click', () => {
      this.showCustomEventModal();
    });

    document.getElementById('cancel-custom-event').addEventListener('click', () => {
      this.hideCustomEventModal();
    });

    document.getElementById('custom-event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCustomEvent();
    });

    // Region selection
    document.getElementById('schedule-server').addEventListener('change', (e) => {
      this.currentRegion = e.target.value;
      this.renderSchedule();
    });

    // Export/Import
    document.getElementById('export-schedule').addEventListener('click', () => {
      this.exportSchedule();
    });

    document.getElementById('clear-schedule').addEventListener('click', () => {
      this.clearSchedule();
    });

    // Modal backdrop click
    document.getElementById('custom-event-modal').addEventListener('click', (e) => {
      if (e.target.id === 'custom-event-modal') {
        this.hideCustomEventModal();
      }
    });

    // Add Discord bot status indicator (only check once on initialization)
    this.updateDiscordBotStatus();
    
    // Set up periodic Discord bot status check (every 30 seconds instead of continuous)
    setInterval(() => {
      this.updateDiscordBotStatus();
    }, 30000);
    
    // Add refresh button for Discord bot data
    const refreshDiscordBtn = document.getElementById('refresh-discord-data');
    if (refreshDiscordBtn) {
      refreshDiscordBtn.addEventListener('click', () => {
        this.refreshDiscordBotData();
      });
    }
  }

  showCustomEventModal() {
    document.getElementById('custom-event-modal').classList.add('show');
    document.getElementById('event-time').value = this.getCurrentTime();
  }

  hideCustomEventModal() {
    document.getElementById('custom-event-modal').classList.remove('show');
    document.getElementById('custom-event-form').reset();
  }

  getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  addCustomEvent() {
    const form = document.getElementById('custom-event-form');
    const formData = new FormData(form);
    
    const event = {
      id: Date.now().toString(),
      name: formData.get('event-name'),
      time: formData.get('event-time'),
      location: formData.get('event-location'),
      faction: formData.get('event-faction'),
      company: formData.get('event-company'),
      notes: formData.get('event-notes'),
      type: 'custom',
      region: this.currentRegion
    };

    this.addEventToSchedule(event);
    this.hideCustomEventModal();
    this.saveSchedule();
    this.renderSchedule();
  }

  convertTimeFormat(timeStr) {
    // Convert "8 PM" to "20:00" format
    const match = timeStr.match(/(\d+)\s*(AM|PM)/i);
    if (!match) return timeStr;

    let hour = parseInt(match[1]);
    const period = match[2].toUpperCase();

    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;

    return `${String(hour).padStart(2, '0')}:00`;
  }



  extractFaction(emojiText) {
    if (emojiText.includes('Syndicate')) return 'syndicate';
    if (emojiText.includes('Covenant')) return 'covenant';
    if (emojiText.includes('Marauders')) return 'marauders';
    return '';
  }

  extractMutation(emojiText) {
    // Extract mutation name from emoji text
    const mutations = ['Blooddrinker', 'LostStopwatch', 'Mjlnir', 'Ruby'];
    for (const mutation of mutations) {
      if (emojiText.includes(mutation)) return mutation;
    }
    return 'Unknown';
  }

  addEventToSchedule(event) {
    const eventDate = this.getEventDate(event.time);
    const dateKey = this.getDateKey(eventDate);
    
    if (!this.schedule[dateKey]) {
      this.schedule[dateKey] = {};
    }

    const timeKey = event.time;
    if (!this.schedule[dateKey][timeKey]) {
      this.schedule[dateKey][timeKey] = [];
    }

    this.schedule[dateKey][timeKey].push(event);
  }

  getEventDate(time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const eventTime = new Date(now);
    eventTime.setHours(hours, minutes, 0, 0);

    // If event time is before current time, assume it's today
    return eventTime;
  }

  getDateKey(date) {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'today';
    return 'today'; // All events go to today for simplicity
  }

  renderSchedule() {
    this.renderDaySchedule('today');
  }

  renderDaySchedule(day) {
    const container = document.querySelector(`#schedule-${day} .time-slots`);
    if (!container) return;

    container.innerHTML = '';
    const daySchedule = this.schedule[day] || {};

    // Create time slots from 6 AM to 2 AM
    for (let hour = 6; hour <= 26; hour++) {
      const timeKey = `${String(hour % 24).padStart(2, '0')}:00`;
      const events = daySchedule[timeKey] || [];

      if (events.length > 0) {
        const timeSlot = this.createTimeSlot(timeKey, events);
        container.appendChild(timeSlot);
      }
    }

    if (container.children.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: #888; padding: 20px;">No events scheduled for today</p>';
    }
  }

  createTimeSlot(time, events) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';

    const header = document.createElement('div');
    header.className = 'time-slot-header';
    header.innerHTML = `
      <span class="time-slot-time">${this.formatTimeDisplay(time)}</span>
      <div class="time-slot-actions">
        <button class="btn-secondary" onclick="scheduleMaker.addEventToTimeSlot('${time}')">➕ Add Event</button>
      </div>
    `;

    timeSlot.appendChild(header);

    events.forEach(event => {
      const eventElement = this.createEventElement(event);
      timeSlot.appendChild(eventElement);
    });

    return timeSlot;
  }

  createEventElement(event) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'event-item';

    const header = document.createElement('div');
    header.className = 'event-header';
    header.innerHTML = `
      <span class="event-name">${event.name || this.getEventDisplayName(event)}</span>
      <span class="event-type ${event.type}">${event.type.toUpperCase()}</span>
    `;

    const details = document.createElement('div');
    details.className = 'event-details';

    if (event.location) {
      details.innerHTML += `<div class="event-detail"><strong>Location:</strong> ${event.location}</div>`;
    }

    if (event.faction) {
      details.innerHTML += `
        <div class="event-detail">
          <strong>Faction:</strong> 
          <span class="faction-icon faction-${event.faction}"></span>
          ${event.faction.charAt(0).toUpperCase() + event.faction.slice(1)}
        </div>
      `;
    }

    if (event.company) {
      details.innerHTML += `<div class="event-detail"><strong>Company:</strong> ${event.company}</div>`;
    }

    if (event.mutation) {
      details.innerHTML += `<div class="event-detail"><strong>Mutation:</strong> ${event.mutation}</div>`;
    }

    if (event.notes) {
      details.innerHTML += `<div class="event-detail"><strong>Notes:</strong> ${event.notes}</div>`;
    }

    eventDiv.appendChild(header);
    eventDiv.appendChild(details);

    return eventDiv;
  }

  getEventDisplayName(event) {
    switch (event.type) {
      case 'race': return 'Race';
      case 'war': return 'War';
      case 'invasion': return 'Invasion';
      case 'mutation': return 'Mutation';
      case 'custom': return event.name;
      default: return 'Event';
    }
  }

  // Convert military time (24-hour) to AM/PM format
  formatTimeDisplay(time) {
    if (!time) return time;
    
    // Handle time strings like "20:00" or "8:00"
    const timeMatch = time.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) return time;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;
    
    return `${hours}:${minutes} ${period}`;
  }

  addEventToTimeSlot(time) {
    // Pre-fill the time in the custom event modal
    // Convert AM/PM format back to 24-hour format for the input
    const timeInput = document.getElementById('event-time');
    if (time.includes('AM') || time.includes('PM')) {
      // Convert from AM/PM to 24-hour format
      const timeMatch = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];
        const period = timeMatch[3].toUpperCase();
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        timeInput.value = `${String(hours).padStart(2, '0')}:${minutes}`;
      } else {
        timeInput.value = time;
      }
    } else {
      timeInput.value = time;
    }
    this.showCustomEventModal();
  }

  saveSchedule() {
    localStorage.setItem('scheduleData', JSON.stringify({
      schedule: this.schedule,
      currentRegion: this.currentRegion
    }));
  }

  loadSchedule() {
    try {
      const data = JSON.parse(localStorage.getItem('scheduleData'));
      if (data) {
        this.schedule = data.schedule || this.schedule;
        this.currentRegion = data.currentRegion || 'east';
        document.getElementById('schedule-server').value = this.currentRegion;
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }

  exportSchedule() {
    const data = {
      schedule: this.schedule,
      currentRegion: this.currentRegion,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule-${this.currentRegion}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    this.showNotification('Schedule exported successfully', 'success');
  }

  clearSchedule() {
    if (confirm('Are you sure you want to clear all events? This cannot be undone.')) {
      this.schedule = { today: {} };
      this.saveSchedule();
      this.renderSchedule();
      this.showNotification('Schedule cleared', 'success');
    }
  }

  autoImportDiscordEvents(events) {
    // Clear existing events for the current region
    this.clearRegionEvents(this.currentRegion);
    
    // Add new events
    events.forEach(event => {
      event.region = this.currentRegion;
      this.addEventToSchedule(event);
    });
    
    this.saveSchedule();
    this.renderSchedule();
    this.showNotification(`Auto-imported ${events.length} events from Discord bot`, 'success');
  }

  clearRegionEvents(region) {
    // Clear events for specific region only
    Object.keys(this.schedule).forEach(day => {
      Object.keys(this.schedule[day]).forEach(time => {
        this.schedule[day][time] = this.schedule[day][time].filter(event => event.region !== region);
        if (this.schedule[day][time].length === 0) {
          delete this.schedule[day][time];
        }
      });
    });
  }

  // Add method to check Discord bot status
  async checkDiscordBotStatus() {
    try {
      const status = await ipcRenderer.invoke('get-discord-bot-status');
      return status;
    } catch (error) {
      console.error('Error checking Discord bot status:', error);
      return { botDirectoryExists: false, dataFileExists: false };
    }
  }

  // Add method to manually refresh Discord bot data
  async refreshDiscordBotData() {
    try {
      console.log('Manually refreshing Discord bot data...');
      const result = await ipcRenderer.invoke('read-discord-bot-data');
      console.log('Refresh result:', result);
      
      if (result.success) {
        this.showNotification('Discord bot data refreshed', 'success');
      } else {
        this.showNotification('Failed to refresh Discord bot data', 'error');
      }
    } catch (error) {
      console.error('Error refreshing Discord bot data:', error);
      this.showNotification('Error refreshing Discord bot data', 'error');
    }
  }

  async updateDiscordBotStatus() {
    const status = await this.checkDiscordBotStatus();
    const statusIndicator = document.getElementById('discord-bot-status');
    
    if (statusIndicator) {
      if (status.botDirectoryExists && status.dataFileExists) {
        statusIndicator.innerHTML = '🟢 Discord Bot Connected';
        statusIndicator.className = 'status-connected';
      } else if (status.botDirectoryExists) {
        statusIndicator.innerHTML = '🟡 Discord Bot Found (waiting for data)';
        statusIndicator.className = 'status-waiting';
      } else {
        statusIndicator.innerHTML = '🔴 Discord Bot Not Found';
        statusIndicator.className = 'status-disconnected';
      }
    }
  }

  showNotification(message, type = 'info') {
    // Reuse the existing notification system
    if (window.ui && window.ui.showNotification) {
      window.ui.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
}

// Daily/Weekly Tracker Class
class DailyWeeklyTracker {
  constructor() {
    this.characters = [];
    this.presetEvents = {
      daily: [
        { name: "Elite Chest Runs", type: "daily", notes: "Daily elite chest runs" },
        { name: "3x Goldcursed Epic Crates - From Well of Fortune", type: "daily", notes: "" },
        { name: "50x Dark Matter - From Well of Fortune", type: "daily", notes: "" },
        { name: "5x Gypsum - From Well of Fortune", type: "daily", notes: "" },
        { name: "3x Dungeons", type: "daily", notes: "Regular dungeon runs" },
        { name: "3x Mutated Dungeons", type: "daily", notes: "Mutated expedition runs" },
        { name: "1x Chromatic Seal", type: "daily", notes: "Daily chromatic seal" },
        { name: "10x Prismatic Ingots", type: "daily", notes: "Daily crafting material" },
        { name: "10x Prismatic Leather", type: "daily", notes: "Daily crafting material" },
        { name: "10x Prismatic Cloth", type: "daily", notes: "Daily crafting material" },
        { name: "10x Prismatic Planks", type: "daily", notes: "Daily crafting material" },
        { name: "10x Prismatic Blocks", type: "daily", notes: "Daily crafting material" },
        { name: "OPR", type: "daily", notes: "Outpost Rush" },
        { name: "Arena", type: "daily", notes: "3v3 Arena" },
        { name: "Faction Missions", type: "daily", notes: "Faction daily missions" },
        { name: "3x World Bosses", type: "daily", notes: "Defeat 3 world bosses each day" },
      ],
      weekly: [
        { name: "Shah Neshen Sandwurm Trial", type: "weekly", notes: "Weekly sandwurm trial" },
        { name: "Hive of Gorgons", type: "weekly", notes: "Weekly gorgon trial" },
        { name: "25x Mutated Expedition Runs", type: "weekly", notes: "Weekly mutated expedition quota" },
        { name: "1x Glittering Gold Key - From Well of Fortune", type: "weekly", notes: "" },
        { name: "1x Cache of Gold-N-Matter - From Gypsum Kiln", type: "weekly", notes: "" },
        { name: "GoldenCursed Coconut", type: "weekly", notes: "Weekly GoldenCursed Coconut event" },
        { name: "Weekly OPR", type: "weekly", notes: "Weekly OPR rewards" },
        { name: "Weekly Arena", type: "weekly", notes: "Weekly arena rewards" }
      ]
    };
    this.initializeTracker();
    this.setupEventListeners();
    this.loadData();
    this.startTimer();
  }

  initializeTracker() {
    this.charactersContainer = document.getElementById('characters-container');
    this.addCharacterBtn = document.getElementById('add-character');
    this.saveDataBtn = document.getElementById('save-tracker-data');
    this.loadDataBtn = document.getElementById('load-tracker-data');
    this.clearDataBtn = document.getElementById('clear-tracker-data');
    
    // Modal elements
    this.addCharacterModal = document.getElementById('add-character-modal');
    this.addEventModal = document.getElementById('add-event-modal');
    this.addCharacterForm = document.getElementById('add-character-form');
    this.addEventForm = document.getElementById('add-event-form');
    
    // Form elements
    this.characterNameInput = document.getElementById('character-name');
    this.eventTypeSelect = document.getElementById('event-type-select');
    this.eventNameInput = document.getElementById('event-name-input');
    this.customTimerGroup = document.getElementById('custom-timer-group');
    this.customTimerHours = document.getElementById('custom-timer-hours');
    this.eventNotes = document.getElementById('event-notes');
    
    // Update reset time display to show local timezone
    this.updateResetTimeDisplay();
  }

  setupEventListeners() {
    // Add character button
    this.addCharacterBtn.addEventListener('click', () => this.showAddCharacterModal());
    
    // Save/Load/Clear buttons
    this.saveDataBtn.addEventListener('click', () => this.saveData());
    this.loadDataBtn.addEventListener('click', () => this.loadData());
    this.clearDataBtn.addEventListener('click', () => this.clearAllData());
    
    // Modal forms
    this.addCharacterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addCharacter();
      return false;
    });
    
    this.addEventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.addEvent();
    });
    
    // Enter key handling for character name input (removed - form submit handles this)
    // this.characterNameInput.addEventListener('keypress', (e) => {
    //   if (e.key === 'Enter') {
    //     e.preventDefault();
    //     this.addCharacter();
    //   }
    // });
    
    // Modal cancel buttons
    document.getElementById('cancel-add-character').addEventListener('click', () => this.hideAddCharacterModal());
    document.getElementById('cancel-add-event').addEventListener('click', () => this.hideAddEventModal());
    
    // Event type select change
    this.eventTypeSelect.addEventListener('change', () => this.handleEventTypeChange());
    
    // Modal backdrop clicks
    this.addCharacterModal.addEventListener('click', (e) => {
      if (e.target === this.addCharacterModal) this.hideAddCharacterModal();
    });
    
    this.addEventModal.addEventListener('click', (e) => {
      if (e.target === this.addEventModal) this.hideAddEventModal();
    });
  }

  showAddCharacterModal() {
    this.addCharacterModal.classList.add('show');
    
    // Force center the modal
    const modal = this.addCharacterModal;
    const modalContent = modal.querySelector('.modal-content');
    
    // Reset any inline styles
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.zIndex = '1000';
    
    // Center the modal content
    modalContent.style.position = 'relative';
    modalContent.style.top = 'auto';
    modalContent.style.left = 'auto';
    modalContent.style.transform = 'none';
    
    // Clear the form and focus
    this.addCharacterForm.reset();
    this.characterNameInput.focus();
  }

  hideAddCharacterModal() {
    this.addCharacterModal.classList.remove('show');
    this.addCharacterForm.reset();
    // Ensure the modal is properly hidden
    this.addCharacterModal.style.display = 'none';
    // Reset focus
    this.characterNameInput.blur();
  }

  showAddEventModal(characterId) {
    this.currentCharacterId = characterId;
    this.addEventModal.classList.add('show');
    this.eventNameInput.focus();
  }

  hideAddEventModal() {
    this.addEventModal.classList.remove('show');
    this.addEventForm.reset();
    this.customTimerGroup.style.display = 'none';
    this.currentCharacterId = null;
  }

  handleEventTypeChange() {
    const eventType = this.eventTypeSelect.value;
    if (eventType === 'custom') {
      this.customTimerGroup.style.display = 'block';
      this.customTimerHours.required = true;
    } else {
      this.customTimerGroup.style.display = 'none';
      this.customTimerHours.required = false;
    }
  }

  addCharacter() {
    const name = this.characterNameInput.value.trim();
    if (!name) return;

    const character = {
      id: Date.now().toString(),
      name: name,
      events: {
        daily: [],
        weekly: [],
        custom: []
      }
    };

    this.characters.push(character);
    this.renderCharacters();
    this.hideAddCharacterModal();
    this.saveData(); // Auto-save when adding character
    this.showNotification(`Character "${name}" added successfully!`, 'success');
  }

  addEvent() {
    if (!this.currentCharacterId) return;

    const eventType = this.eventTypeSelect.value;
    const eventName = this.eventNameInput.value.trim();
    const notes = this.eventNotes.value.trim();

    if (!eventType || !eventName) return;

    let timerHours = 24; // Default daily
    if (eventType === 'weekly') {
      timerHours = 168; // 7 days
    } else if (eventType === 'custom') {
      timerHours = parseInt(this.customTimerHours.value) || 24;
    }

    const event = {
      id: Date.now().toString(),
      name: eventName,
      type: eventType,
      timerHours: timerHours,
      notes: notes,
      lastCompleted: null,
      nextReset: this.calculateNextReset(eventType, timerHours)
    };

    const character = this.characters.find(c => c.id === this.currentCharacterId);
    if (character) {
      character.events[eventType].push(event);
      this.renderCharacters();
      this.hideAddEventModal();
      this.showNotification(`Event "${eventName}" added to ${character.name}!`, 'success');
    }
  }

  calculateNextReset(eventType, timerHours) {
    const now = new Date();
    let resetTime;
    
    // Get settings from settings manager or use defaults
    const settings = window.settingsManager ? window.settingsManager.getSettings() : {
      resetTimezone: 'EST',
      dailyResetHour: 5,
      weeklyResetDay: 2,
      weeklyResetHour: 5
    };

    if (eventType === 'daily') {
      // Daily reset using settings
      resetTime = new Date(now);
      
      // Calculate timezone offset based on settings
      const localOffsetMinutes = now.getTimezoneOffset();
      const targetTimezoneOffset = this.getTimezoneOffsetMinutes(settings.resetTimezone);
      const offsetDifferenceMinutes = targetTimezoneOffset - localOffsetMinutes;
      
      // Set the reset time using settings
      resetTime.setHours(settings.dailyResetHour, 0, 0, 0);
      resetTime.setMinutes(resetTime.getMinutes() + offsetDifferenceMinutes);
      
      // If the reset time has already passed today, set it to tomorrow
      if (resetTime <= now) {
        resetTime.setDate(resetTime.getDate() + 1);
      }
    } else if (eventType === 'weekly') {
      // Weekly reset using settings
      resetTime = new Date(now);
      const daysUntilReset = (settings.weeklyResetDay - resetTime.getDay() + 7) % 7;
      resetTime.setDate(resetTime.getDate() + daysUntilReset);
      
      // Calculate timezone offset based on settings
      const localOffsetMinutes = now.getTimezoneOffset();
      const targetTimezoneOffset = this.getTimezoneOffsetMinutes(settings.resetTimezone);
      const offsetDifferenceMinutes = targetTimezoneOffset - localOffsetMinutes;
      
      // Set the reset time using settings
      resetTime.setHours(settings.weeklyResetHour, 0, 0, 0);
      resetTime.setMinutes(resetTime.getMinutes() + offsetDifferenceMinutes);
      
      // If the reset time has already passed this week, set it to next week
      if (resetTime <= now) {
        resetTime.setDate(resetTime.getDate() + 7);
      }
    } else {
      // Custom timer
      resetTime = new Date(now.getTime() + (timerHours * 60 * 60 * 1000));
    }

    return resetTime;
  }
  
  getTimezoneOffsetMinutes(timezone) {
    // Convert timezone string to offset in minutes
    const timezoneOffsets = {
      'EST': 5 * 60,   // UTC-5
      'CST': 6 * 60,   // UTC-6
      'MST': 7 * 60,   // UTC-7
      'PST': 8 * 60,   // UTC-8
      'GMT': 0,        // UTC+0
      'UTC': 0         // UTC+0
    };
    
    return timezoneOffsets[timezone] || 5 * 60; // Default to EST
  }

  renderCharacters() {
    // Save current collapse states before re-rendering
    const collapseStates = this.saveCollapseStates();
    
    if (this.characters.length === 0) {
      this.charactersContainer.innerHTML = `
        <div class="empty-state">
          <h3>No Characters Added</h3>
          <p>Add your first character to start tracking daily and weekly events!</p>
          <button class="btn-primary" onclick="dailyWeeklyTracker.showAddCharacterModal()">Add Character</button>
        </div>
      `;
      return;
    }

    this.charactersContainer.innerHTML = this.characters.map(character => `
      <div class="character-section" data-character-id="${character.id}">
        <div class="character-header">
          <div class="character-header-left">
            <button class="collapse-toggle" onclick="dailyWeeklyTracker.toggleCharacterCollapse('${character.id}')">
              <span class="collapse-icon">▼</span>
            </button>
            <h3 class="character-name" onclick="dailyWeeklyTracker.startEditCharacterName('${character.id}')" title="Click to edit">${character.name}</h3>
          </div>
          <div class="character-controls">
            <button class="btn-add-event" onclick="dailyWeeklyTracker.showAddEventModal('${character.id}')">
              ➕ Add Event
            </button>
            <button class="btn-remove-character" onclick="dailyWeeklyTracker.removeCharacter('${character.id}')">
              🗑️ Remove
            </button>
          </div>
        </div>
        
        <div class="character-content" data-character-content="${character.id}">
          <div class="events-container">
            ${this.renderEventCategory(character, 'daily')}
            ${this.renderEventCategory(character, 'weekly')}
            ${this.renderEventCategory(character, 'custom')}
          </div>
          
          ${this.renderPresetEvents(character)}
        </div>
      </div>
    `).join('');

    // Add event listeners to the rendered elements
    this.addEventListeners();
    
    // Restore collapse states after re-rendering
    this.restoreCollapseStates(collapseStates);
  }

  renderEventCategory(character, category) {
    const events = character.events[category];
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Hide custom category if no custom events exist
    if (category === 'custom' && events.length === 0) {
      return '';
    }
    
    if (events.length === 0) {
      return `
        <div class="event-category">
          <div class="event-category-header">
            <h4 class="event-category-title">${categoryTitle}</h4>
            <span class="event-category-count">0</span>
          </div>
          <div class="event-list">
            <div class="empty-state">
              <p>No ${category} events added yet.</p>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="event-category">
        <div class="event-category-header">
          <h4 class="event-category-title">${categoryTitle}</h4>
          <span class="event-category-count">${events.length}</span>
        </div>
        <div class="event-list">
          ${events.map(event => this.renderEventItem(character.id, event)).join('')}
        </div>
      </div>
    `;
  }

  renderEventItem(characterId, event) {
    const now = new Date();
    const nextReset = new Date(event.nextReset);
    const isCompleted = event.lastCompleted && new Date(event.lastCompleted) < nextReset;
    const isOverdue = !isCompleted && nextReset < now;
    
    let timerText = '';
    let timerClass = '';
    
    if (isCompleted) {
      timerText = '✅ Completed';
      timerClass = 'completed';
    } else if (isOverdue) {
      timerText = '⚠️ Overdue';
      timerClass = 'overdue';
    } else {
      const timeLeft = nextReset - now;
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      timerText = `⏰ ${hours}h ${minutes}m ${seconds}s remaining`;
    }

    return `
      <div class="event-item ${isCompleted ? 'completed' : 'incomplete'} ${isOverdue ? 'overdue' : ''}" 
           data-event-id="${event.id}" 
           data-character-id="${characterId}"
           ondblclick="dailyWeeklyTracker.toggleEventCompletion('${characterId}', '${event.id}')">
        <div class="event-header">
          <div class="event-header-left">
            <button class="event-collapse-toggle" onclick="dailyWeeklyTracker.toggleEventCollapse('${characterId}', '${event.id}')">
              <span class="event-collapse-icon">▼</span>
            </button>
            <h5 class="event-name">${event.name}</h5>
          </div>
          <div class="event-header-right">
            <span class="event-type-badge ${event.type}">${event.type}</span>
          </div>
        </div>
        <div class="event-content" data-event-content="${event.id}">
          <div class="event-timer ${timerClass}">${timerText}</div>
          ${event.notes ? `<div class="event-notes">${event.notes}</div>` : ''}
          <div class="event-actions">
            ${!isCompleted ? `<button class="btn-complete" onclick="dailyWeeklyTracker.completeEvent('${characterId}', '${event.id}')">Complete</button>` : ''}
            <button class="btn-reset" onclick="dailyWeeklyTracker.resetEvent('${characterId}', '${event.id}')">Reset</button>
            <button class="btn-remove" onclick="dailyWeeklyTracker.removeEvent('${characterId}', '${event.id}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }

  renderPresetEvents(character) {
    return `
      <div class="preset-events">
        <h4>Quick Add Preset Events</h4>
        <div class="preset-events-grid">
          ${this.presetEvents.daily.map(event => `
            <button class="preset-event-btn ${this.isPresetEventAdded(character, event) ? 'added' : ''}" 
                    onclick="dailyWeeklyTracker.addPresetEvent('${character.id}', '${event.name}', '${event.type}', '${event.notes}')">
              ${event.name}
            </button>
          `).join('')}
          ${this.presetEvents.weekly.map(event => `
            <button class="preset-event-btn ${this.isPresetEventAdded(character, event) ? 'added' : ''}" 
                    onclick="dailyWeeklyTracker.addPresetEvent('${character.id}', '${event.name}', '${event.type}', '${event.notes}')">
              ${event.name}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  isPresetEventAdded(character, presetEvent) {
    return character.events[presetEvent.type].some(event => event.name === presetEvent.name);
  }

  addPresetEvent(characterId, eventName, eventType, notes) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    // Check if already added
    if (this.isPresetEventAdded(character, { name: eventName, type: eventType })) {
      this.showNotification(`${eventName} is already added to ${character.name}!`, 'warning');
      return;
    }

    const event = {
      id: Date.now().toString(),
      name: eventName,
      type: eventType,
      timerHours: eventType === 'daily' ? 24 : 168,
      notes: notes,
      lastCompleted: null,
      nextReset: this.calculateNextReset(eventType, eventType === 'daily' ? 24 : 168)
    };

    character.events[eventType].push(event);
    this.renderCharacters();
    this.showNotification(`${eventName} added to ${character.name}!`, 'success');
  }

  addEventListeners() {
    // Add any additional event listeners for rendered elements
  }

  completeEvent(characterId, eventId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const event = character.events.daily.concat(character.events.weekly, character.events.custom)
      .find(e => e.id === eventId);
    
    if (event) {
      event.lastCompleted = new Date().toISOString();
      this.updateEventDisplay(characterId, event);
      this.saveData();
      this.showNotification(`${event.name} marked as completed!`, 'success');
    }
  }

  toggleEventCompletion(characterId, eventId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const event = character.events.daily.concat(character.events.weekly, character.events.custom)
      .find(e => e.id === eventId);
    
    if (event) {
      const isCompleted = event.lastCompleted && new Date(event.lastCompleted) < new Date(event.nextReset);
      
      if (isCompleted) {
        // Uncomplete the event
        event.lastCompleted = null;
        this.showNotification(`${event.name} marked as incomplete!`, 'info');
      } else {
        // Complete the event
        event.lastCompleted = new Date().toISOString();
        this.showNotification(`${event.name} marked as completed!`, 'success');
      }
      
      this.updateEventDisplay(characterId, event);
      this.saveData();
    }
  }

  resetEvent(characterId, eventId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const event = character.events.daily.concat(character.events.weekly, character.events.custom)
      .find(e => e.id === eventId);
    
    if (event) {
      event.lastCompleted = null;
      event.nextReset = this.calculateNextReset(event.type, event.timerHours);
      this.renderCharacters();
      this.saveData();
      this.showNotification(`${event.name} reset!`, 'success');
    }
  }

  removeEvent(characterId, eventId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const event = character.events.daily.concat(character.events.weekly, character.events.custom)
      .find(e => e.id === eventId);
    
    if (event) {
      const eventType = event.type;
      character.events[eventType] = character.events[eventType].filter(e => e.id !== eventId);
      this.renderCharacters();
      this.showNotification(`${event.name} removed!`, 'success');
    }
  }

  removeCharacter(characterId) {
    if (confirm('Are you sure you want to remove this character and all their events?')) {
      this.characters = this.characters.filter(c => c.id !== characterId);
      this.renderCharacters();
      this.showNotification('Character removed!', 'success');
    }
  }

  startTimer() {
    // Get refresh interval from settings
    const settings = window.settingsManager ? window.settingsManager.getSettings() : { autoRefreshTimers: 1000 };
    const refreshInterval = settings.autoRefreshTimers || 1000;
    
    // Clear existing timer if it exists
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Update timers at the specified interval
    this.timerInterval = setInterval(() => {
      this.updateTimers();
    }, refreshInterval);
  }

  updateTimers() {
    // Update all event timers without full re-render
    this.characters.forEach(character => {
      character.events.daily.concat(character.events.weekly, character.events.custom).forEach(event => {
        const now = new Date();
        const nextReset = new Date(event.nextReset);
        
        // If the reset time has passed and the event was completed, calculate new reset time
        if (nextReset < now && event.lastCompleted) {
          event.nextReset = this.calculateNextReset(event.type, event.timerHours);
        }
        
        // Also check if the reset time is in the past for incomplete events and recalculate
        // This handles cases where the timezone fix changed the reset time
        if (nextReset < now && !event.lastCompleted) {
          event.nextReset = this.calculateNextReset(event.type, event.timerHours);
        }
        
        // Update just the timer text for this event
        this.updateEventTimer(character.id, event);
      });
    });
  }

  updateEventDisplay(characterId, event) {
    const eventElement = document.querySelector(`[data-character-id="${characterId}"] [data-event-id="${event.id}"]`);
    if (!eventElement) return;
    
    const now = new Date();
    const nextReset = new Date(event.nextReset);
    const isCompleted = event.lastCompleted && new Date(event.lastCompleted) < nextReset;
    const isOverdue = !isCompleted && nextReset < now;
    
    // Update CSS classes for color coding
    eventElement.classList.remove('completed', 'incomplete', 'overdue');
    if (isCompleted) {
      eventElement.classList.add('completed');
    } else if (isOverdue) {
      eventElement.classList.add('overdue');
    } else {
      eventElement.classList.add('incomplete');
    }
    
    // Update timer text
    const timerElement = eventElement.querySelector('.event-timer');
    if (timerElement) {
      let timerText = '';
      let timerClass = '';
      
      if (isCompleted) {
        timerText = '✅ Completed';
        timerClass = 'completed';
      } else if (isOverdue) {
        timerText = '⚠️ Overdue';
        timerClass = 'overdue';
      } else {
        const timeLeft = nextReset - now;
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        timerText = `⏰ ${hours}h ${minutes}m ${seconds}s remaining`;
      }
      
      timerElement.textContent = timerText;
      timerElement.className = `event-timer ${timerClass}`;
    }
    
    // Update action buttons
    const actionsElement = eventElement.querySelector('.event-actions');
    if (actionsElement) {
      if (isCompleted) {
        // Hide complete button when completed
        const completeBtn = actionsElement.querySelector('.btn-complete');
        if (completeBtn) completeBtn.style.display = 'none';
      } else {
        // Show complete button when not completed
        const completeBtn = actionsElement.querySelector('.btn-complete');
        if (completeBtn) completeBtn.style.display = '';
      }
    }
  }

  updateEventTimer(characterId, event) {
    const eventElement = document.querySelector(`[data-character-id="${characterId}"] [data-event-id="${event.id}"]`);
    if (!eventElement) return;
    
    const now = new Date();
    const nextReset = new Date(event.nextReset);
    const isCompleted = event.lastCompleted && new Date(event.lastCompleted) < nextReset;
    const isOverdue = !isCompleted && nextReset < now;
    
    // Check if reset time has passed and auto-reset completed events
    if (nextReset < now && isCompleted) {
      event.lastCompleted = null;
      event.nextReset = this.calculateNextReset(event.type, event.timerHours);
      this.saveData();
    }
    
    // Update the display
    this.updateEventDisplay(characterId, event);
  }

  saveData() {
    try {
      const data = {
        characters: this.characters,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('dailyWeeklyTrackerData', JSON.stringify(data));
      this.showNotification('Data saved successfully!', 'success');
    } catch (error) {
      this.showNotification('Failed to save data!', 'error');
    }
  }

  loadData() {
    try {
      const savedData = localStorage.getItem('dailyWeeklyTrackerData');
      if (savedData) {
        const data = JSON.parse(savedData);
        this.characters = data.characters || [];
        
        // Recalculate all reset times with the corrected timezone logic
        this.recalculateAllResetTimes();
        
        this.renderCharacters();
        this.showNotification('Data loaded successfully!', 'success');
      } else {
        this.showNotification('No saved data found!', 'warning');
      }
    } catch (error) {
      this.showNotification('Failed to load data!', 'error');
    }
  }

  recalculateAllResetTimes() {
    // Force recalculation of all event reset times with the corrected timezone logic
    this.characters.forEach(character => {
      character.events.daily.concat(character.events.weekly, character.events.custom).forEach(event => {
        event.nextReset = this.calculateNextReset(event.type, event.timerHours);
        // If the event was completed before the new reset, clear lastCompleted
        if (event.lastCompleted && new Date(event.lastCompleted) < new Date(event.nextReset)) {
          event.lastCompleted = null;
        }
      });
    });
    // Save the updated data
    this.saveData();
  }



  updateResetTimeDisplay() {
    // Get settings from settings manager or use defaults
    const settings = window.settingsManager ? window.settingsManager.getSettings() : {
      resetTimezone: 'EST',
      dailyResetHour: 5,
      weeklyResetDay: 2,
      weeklyResetHour: 5,
      timeFormat: '12',
      showTimezone: true
    };
    
    // Calculate daily reset time using settings
    const now = new Date();
    const localOffsetMinutes = now.getTimezoneOffset();
    const targetTimezoneOffset = this.getTimezoneOffsetMinutes(settings.resetTimezone);
    const offsetDifferenceMinutes = targetTimezoneOffset - localOffsetMinutes;
    
    // Calculate today's reset time
    const dailyResetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), settings.dailyResetHour, 0, 0, 0);
    dailyResetTime.setMinutes(dailyResetTime.getMinutes() + offsetDifferenceMinutes);
    
    // If reset time has passed today, show tomorrow's reset
    if (dailyResetTime <= now) {
      dailyResetTime.setDate(dailyResetTime.getDate() + 1);
    }
    
    // Calculate weekly reset time using settings
    const weeklyResetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), settings.weeklyResetHour, 0, 0, 0);
    weeklyResetTime.setMinutes(weeklyResetTime.getMinutes() + offsetDifferenceMinutes);
    
    // Find next reset day
    const daysUntilReset = (settings.weeklyResetDay - weeklyResetTime.getDay() + 7) % 7;
    weeklyResetTime.setDate(weeklyResetTime.getDate() + daysUntilReset);
    
    // If reset has passed this week, show next week
    if (weeklyResetTime <= now) {
      weeklyResetTime.setDate(weeklyResetTime.getDate() + 7);
    }
    
    // Format times for display based on settings
    const formatTime = (date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      if (settings.timeFormat === '24') {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
      }
    };
    
    const formatDate = (date) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${days[date.getDay()]} ${formatTime(date)}`;
    };
    
    // Get timezone abbreviation if enabled
    let timezoneAbbr = '';
    if (settings.showTimezone) {
      timezoneAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(now)
        .find(part => part.type === 'timeZoneName')?.value || 'Local';
      timezoneAbbr = ` ${timezoneAbbr}`;
    }
    
    // Update the display elements
    const dailyResetDisplay = document.getElementById('daily-reset-display');
    const weeklyResetDisplay = document.getElementById('weekly-reset-display');
    
    if (dailyResetDisplay) {
      dailyResetDisplay.textContent = `${formatTime(dailyResetTime)}${timezoneAbbr}`;
    }
    
    if (weeklyResetDisplay) {
      weeklyResetDisplay.textContent = `${formatDate(weeklyResetTime)}${timezoneAbbr}`;
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
      this.characters = [];
      localStorage.removeItem('dailyWeeklyTrackerData');
      this.renderCharacters();
      this.showNotification('All data cleared!', 'success');
    }
  }

  toggleCharacterCollapse(characterId) {
    const characterSection = document.querySelector(`[data-character-id="${characterId}"]`);
    const contentElement = characterSection.querySelector(`[data-character-content="${characterId}"]`);
    const collapseIcon = characterSection.querySelector('.collapse-icon');
    
    if (contentElement.style.display === 'none') {
      // Expand
      contentElement.style.display = 'block';
      collapseIcon.textContent = '▼';
      characterSection.classList.remove('collapsed');
    } else {
      // Collapse
      contentElement.style.display = 'none';
      collapseIcon.textContent = '▶';
      characterSection.classList.add('collapsed');
    }
  }

  toggleEventCollapse(characterId, eventId) {
    const eventItem = document.querySelector(`[data-character-id="${characterId}"] [data-event-id="${eventId}"]`);
    const contentElement = eventItem.querySelector(`[data-event-content="${eventId}"]`);
    const collapseIcon = eventItem.querySelector('.event-collapse-icon');
    
    if (contentElement.style.display === 'none') {
      // Expand
      contentElement.style.display = 'block';
      collapseIcon.textContent = '▼';
      eventItem.classList.remove('collapsed');
    } else {
      // Collapse
      contentElement.style.display = 'none';
      collapseIcon.textContent = '▶';
      eventItem.classList.add('collapsed');
    }
  }

  saveCollapseStates() {
    const states = {
      characters: {},
      events: {}
    };
    
    // Save character collapse states
    this.characters.forEach(character => {
      const characterSection = document.querySelector(`[data-character-id="${character.id}"]`);
      if (characterSection) {
        states.characters[character.id] = characterSection.classList.contains('collapsed');
      }
    });
    
    // Save event collapse states
    this.characters.forEach(character => {
      character.events.daily.concat(character.events.weekly, character.events.custom).forEach(event => {
        const eventItem = document.querySelector(`[data-character-id="${character.id}"] [data-event-id="${event.id}"]`);
        if (eventItem) {
          states.events[event.id] = eventItem.classList.contains('collapsed');
        }
      });
    });
    
    return states;
  }

  restoreCollapseStates(states) {
    if (!states) return;
    
    // Restore character collapse states
    Object.entries(states.characters).forEach(([characterId, isCollapsed]) => {
      const characterSection = document.querySelector(`[data-character-id="${characterId}"]`);
      if (characterSection) {
        if (isCollapsed) {
          const contentElement = characterSection.querySelector(`[data-character-content="${characterId}"]`);
          const collapseIcon = characterSection.querySelector('.collapse-icon');
          if (contentElement) contentElement.style.display = 'none';
          if (collapseIcon) collapseIcon.textContent = '▶';
          characterSection.classList.add('collapsed');
        }
      }
    });
    
    // Restore event collapse states
    Object.entries(states.events).forEach(([eventId, isCollapsed]) => {
      const eventItem = document.querySelector(`[data-event-id="${eventId}"]`);
      if (eventItem) {
        if (isCollapsed) {
          const contentElement = eventItem.querySelector(`[data-event-content="${eventId}"]`);
          const collapseIcon = eventItem.querySelector('.event-collapse-icon');
          if (contentElement) contentElement.style.display = 'none';
          if (collapseIcon) collapseIcon.textContent = '▶';
          eventItem.classList.add('collapsed');
        }
      }
    });
  }

  startEditCharacterName(characterId) {
    const character = this.characters.find(c => c.id === characterId);
    if (!character) return;

    const nameElement = document.querySelector(`[data-character-id="${characterId}"] .character-name`);
    if (!nameElement) return;

    const currentName = character.name;
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'character-name-edit';
    input.style.cssText = `
      background: rgba(255, 140, 0, 0.1);
      border: 2px solid #ff8c00;
      border-radius: 4px;
      color: #ff8c00;
      font-size: 1.2rem;
      font-weight: 600;
      padding: 4px 8px;
      margin: 0;
      outline: none;
      min-width: 100px;
    `;

    // Replace the h3 with the input
    nameElement.style.display = 'none';
    nameElement.parentNode.insertBefore(input, nameElement.nextSibling);
    
    // Focus and select all text
    input.focus();
    input.select();

    // Handle save on Enter or blur
    const saveEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        character.name = newName;
        this.renderCharacters();
        this.saveData();
        this.showNotification(`Character renamed to "${newName}"!`, 'success');
      } else {
        // Restore original name element
        input.remove();
        nameElement.style.display = '';
      }
    };

    const cancelEdit = () => {
      input.remove();
      nameElement.style.display = '';
    };

    // Event listeners
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    });

    input.addEventListener('blur', saveEdit);

    // Prevent click events from bubbling
    input.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  showNotification(message, type = 'info') {
    // Reuse the existing notification system
    if (window.ui && window.ui.showNotification) {
      window.ui.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }
}

// Settings Manager Class
class SettingsManager {
  constructor() {
    this.defaultSettings = {
      // Reset Settings
      resetTimezone: 'EST',
      dailyResetHour: 5,
      weeklyResetDay: 2, // Tuesday
      weeklyResetHour: 5,
      
      // Display Settings
      timeFormat: '12', // 12 or 24 hour
      showTimezone: true,
      autoRefreshTimers: 1000, // milliseconds
      
      // Notification Settings
      enableNotifications: true,
      notificationSound: 'default',
      notificationDuration: 3,
      
      // Data Management
      autoSaveInterval: 5, // minutes
      backupData: true,
      maxBackupFiles: 10
    };
    
    this.settings = { ...this.defaultSettings };
    this.loadSettings();
    this.setupEventListeners();
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this.settings = { ...this.defaultSettings, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = { ...this.defaultSettings };
    }
    this.applySettingsToUI();
  }
  
  saveSettings() {
    try {
      this.collectSettingsFromUI();
      localStorage.setItem('appSettings', JSON.stringify(this.settings));
      this.showNotification('Settings saved successfully!', 'success');
      
      // Apply settings to other components
      this.applySettingsToComponents();
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showNotification('Failed to save settings!', 'error');
    }
  }
  
  collectSettingsFromUI() {
    this.settings.resetTimezone = document.getElementById('reset-timezone').value;
    this.settings.dailyResetHour = parseInt(document.getElementById('daily-reset-hour').value);
    this.settings.weeklyResetDay = parseInt(document.getElementById('weekly-reset-day').value);
    this.settings.weeklyResetHour = parseInt(document.getElementById('weekly-reset-hour').value);
    
    this.settings.timeFormat = document.getElementById('time-format').value;
    this.settings.showTimezone = document.getElementById('show-timezone').checked;
    this.settings.autoRefreshTimers = parseInt(document.getElementById('auto-refresh-timers').value);
    
    this.settings.enableNotifications = document.getElementById('enable-notifications').checked;
    this.settings.notificationSound = document.getElementById('notification-sound').value;
    this.settings.notificationDuration = parseInt(document.getElementById('notification-duration').value);
    
    this.settings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value);
    this.settings.backupData = document.getElementById('backup-data').checked;
    this.settings.maxBackupFiles = parseInt(document.getElementById('max-backup-files').value);
  }
  
  applySettingsToUI() {
    document.getElementById('reset-timezone').value = this.settings.resetTimezone;
    document.getElementById('daily-reset-hour').value = this.settings.dailyResetHour;
    document.getElementById('weekly-reset-day').value = this.settings.weeklyResetDay;
    document.getElementById('weekly-reset-hour').value = this.settings.weeklyResetHour;
    
    document.getElementById('time-format').value = this.settings.timeFormat;
    document.getElementById('show-timezone').checked = this.settings.showTimezone;
    document.getElementById('auto-refresh-timers').value = this.settings.autoRefreshTimers;
    
    document.getElementById('enable-notifications').checked = this.settings.enableNotifications;
    document.getElementById('notification-sound').value = this.settings.notificationSound;
    document.getElementById('notification-duration').value = this.settings.notificationDuration;
    
    document.getElementById('auto-save-interval').value = this.settings.autoSaveInterval;
    document.getElementById('backup-data').checked = this.settings.backupData;
    document.getElementById('max-backup-files').value = this.settings.maxBackupFiles;
  }
  
  applySettingsToComponents() {
    // Apply settings to DailyWeeklyTracker
    if (window.dailyWeeklyTracker) {
      dailyWeeklyTracker.applySettings(this.settings);
    }
    
    // Apply settings to ScheduleMaker
    if (window.scheduleMaker) {
      scheduleMaker.applySettings(this.settings);
    }
  }
  
  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settings = { ...this.defaultSettings };
      this.applySettingsToUI();
      this.saveSettings();
      this.showNotification('Settings reset to defaults!', 'info');
    }
  }
  
  exportSettings() {
    try {
      const dataStr = JSON.stringify(this.settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `nw-buddy-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      this.showNotification('Settings exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export settings:', error);
      this.showNotification('Failed to export settings!', 'error');
    }
  }
  
  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedSettings = JSON.parse(e.target.result);
            this.settings = { ...this.defaultSettings, ...importedSettings };
            this.applySettingsToUI();
            this.saveSettings();
            this.showNotification('Settings imported successfully!', 'success');
          } catch (error) {
            console.error('Failed to import settings:', error);
            this.showNotification('Failed to import settings! Invalid file format.', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }
  
  setupEventListeners() {
    document.getElementById('save-settings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('reset-settings').addEventListener('click', () => {
      this.resetToDefaults();
    });
    
    document.getElementById('export-settings').addEventListener('click', () => {
      this.exportSettings();
    });
    
    document.getElementById('import-settings').addEventListener('click', () => {
      this.importSettings();
    });
  }
  
  showNotification(message, type = 'info') {
    // Use the existing notification system if available
    if (window.dailyWeeklyTracker && window.dailyWeeklyTracker.showNotification) {
      window.dailyWeeklyTracker.showNotification(message, type);
    } else {
      // Fallback notification
      alert(message);
    }
  }
  
  getSettings() {
    return this.settings;
  }
  
  applySettings(settings) {
    // Apply new settings to the tracker
    this.settings = { ...this.settings, ...settings };
    
    // Recalculate all reset times with new settings
    this.recalculateAllResetTimes();
    
    // Update the reset time display
    this.updateResetTimeDisplay();
    
    // Restart timer with new refresh interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.startTimer();
  }
}

// Initialize the UI when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Settings Manager
  window.settingsManager = new SettingsManager();
  
  const ui = new NWBuddyScraperUI();
  window.ui = ui; // Make ui available globally for ScheduleMaker
  
  const modal = document.getElementById('price-modal');
  const form = document.getElementById('price-form');
  if (modal && form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      const formData = new FormData(form);
      const prices = {};
      for (const [key, value] of formData.entries()) {
        prices[key] = parseFloat(value);
      }
      // Hide the modal
      modal.classList.remove('show');
      // Save prices persistently
      await ipcRenderer.invoke('save-market-prices', prices);
      // Update in-memory prices
      if (ui.currentResults && ui.currentResults.marketPrices) {
        ui.currentResults.marketPrices.prices = { ...prices };
        // Recalculate crafting costs using backend logic (via IPC)
        const gearData = ui.currentResults;
        const result = await ipcRenderer.invoke('calculate-crafting-costs', gearData, prices);
        if (result && result.success && result.data) {
          ui.currentResults.craftingCosts = result.data;
        }
        // Re-render the results with the new prices and costs
        ui.showResults(ui.currentResults, true);
      }
      return false;
    });
    // Load saved prices and prefill the form when modal is shown
    modal.addEventListener('show', async function() {
      const result = await ipcRenderer.invoke('load-market-prices');
      if (result && result.success && result.prices) {
        for (const [key, value] of Object.entries(result.prices)) {
          const input = form.querySelector(`[name="${key}"]`);
          if (input) input.value = value;
        }
      }
    });
  }

  // Tab switching logic
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const previousTab = document.querySelector('.tab-btn.active')?.dataset.tab;
      const newTab = btn.dataset.tab;
      
      // Remove active from all buttons and contents
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activate the clicked tab and its content
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      
      // Handle NW Buddy view visibility
      if (previousTab === 'nwb' && newTab !== 'nwb') {
        // Switching away from NWB tab - hide the view
        await ipcRenderer.invoke('switch-from-nwb-tab');
      } else if (newTab === 'nwb' && previousTab !== 'nwb') {
        // Switching to NWB tab - show the view if it exists
        await ipcRenderer.invoke('switch-to-nwb-tab');
      }
    });
  });

  // Restore tab order from localStorage
  const tabBar = document.querySelector('.tab-bar');
  const tabBtns = Array.from(tabBar.querySelectorAll('.tab-btn'));
  const tabOrder = loadTabOrder();
  if (tabOrder && Array.isArray(tabOrder)) {
    tabOrder.forEach(tab => {
      const btn = document.getElementById('tab-btn-' + tab);
      if (btn) tabBar.appendChild(btn);
    });
    reorderTabContents(tabOrder);
  }
  
  // Drag and drop logic
  let dragSrc = null;
  tabBar.addEventListener('dragstart', function(e) {
    if (e.target.classList.contains('tab-btn')) {
      dragSrc = e.target;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragSrc.dataset.tab);
    }
  });
  tabBar.addEventListener('dragover', function(e) {
    if (e.target.classList.contains('tab-btn')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });
  tabBar.addEventListener('drop', function(e) {
    if (e.target.classList.contains('tab-btn')) {
      e.preventDefault();
      const fromTab = dragSrc.dataset.tab;
      const toTab = e.target.dataset.tab;
      if (fromTab === toTab) return;
      // Reorder tab buttons
      const btns = Array.from(tabBar.querySelectorAll('.tab-btn'));
      const order = btns.map(b => b.dataset.tab);
      const fromIdx = order.indexOf(fromTab);
      const toIdx = order.indexOf(toTab);
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, fromTab);
      // Apply new order
      order.forEach(tab => {
        const btn = document.getElementById('tab-btn-' + tab);
        if (btn) tabBar.appendChild(btn);
      });
      reorderTabContents(order);
      saveTabOrder(order);
    }
  });

  // Initialize Schedule Maker
  scheduleMaker = new ScheduleMaker();
  
  // Initialize Daily/Weekly Tracker
  window.dailyWeeklyTracker = new DailyWeeklyTracker();
});

// Handle window controls
window.addEventListener("beforeunload", () => {
  // Clean up if needed
});

// Add some sample URLs for testing
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url-input");

  // Add placeholder with generic example
  urlInput.placeholder =
    "Enter a link like this: https://www.nw-buddy.de/gearsets/share/...";

  // Add context menu for sample URLs
  urlInput.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    // Could add a context menu with sample URLs here
  });
});

// Helper to update the market prices display
function updateMarketPrices(prices) {
  const resultsContent = document.getElementById('results-content');
  if (!resultsContent) return;
  const marketBox = resultsContent.querySelector('.market-prices-section');
  if (!marketBox) return;
  // Update each price
  Object.entries(prices).forEach(([key, value]) => {
    // Find the price-item for this key
    const itemDiv = Array.from(marketBox.querySelectorAll('.price-item')).find(div =>
      div.querySelector('.item-name') && div.querySelector('.item-name').textContent.trim() === key
    );
    if (itemDiv) {
      const priceValue = itemDiv.querySelector('.price-value');
      if (priceValue) {
        priceValue.textContent = `${value.toFixed(2)} gold`;
      }
    }
  });
}

// Add this function to update only the Market Prices and Crafting Costs sections
async function updateMarketAndCosts(ui, prices) {
  // Update in-memory prices
  if (ui.currentResults && ui.currentResults.marketPrices) {
    ui.currentResults.marketPrices.prices = { ...prices };
    // Recalculate crafting costs using backend logic (via IPC)
    const gearData = ui.currentResults;
    const result = await ipcRenderer.invoke('calculate-crafting-costs', gearData, prices);
    if (result && result.success && result.data) {
      ui.currentResults.craftingCosts = result.data;
    }
    // Update the Market Prices section
    updateMarketPrices(prices);
    // Update the Crafting Costs section
    updateCraftingCosts(ui.currentResults.craftingCosts);
    // Ensure results section is visible
    if (ui.resultsSection) ui.resultsSection.classList.add('show');
    // Hide input section if present
    const inputSection = document.querySelector('.input-section');
    if (inputSection) inputSection.classList.remove('show');
  }
}

// Add this function to update the Crafting Costs section
function updateCraftingCosts(costs) {
  const resultsContent = document.getElementById('results-content');
  if (!resultsContent) return;
  const costsBox = Array.from(resultsContent.querySelectorAll('div')).find(div =>
    div.textContent && div.textContent.includes('Crafting Costs')
  );
  if (!costsBox) return;
  // Rebuild the costs list
  let craftingCostsHTML = '';
  if (costs && Object.keys(costs).length > 0) {
    const totalCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    craftingCostsHTML = `
      <h3>💸 Crafting Costs</h3>
      <div class="costs-list">
        ${Object.entries(costs).map(([item, cost]) => 
          `<div class="cost-item">
            <span class="item-name">${item}</span>
            <span class="cost-value">${this.formatNumber(cost)} gold</span>
          </div>`
        ).join('')}
      </div>
      <div class="total-cost">
        <strong>Total Crafting Cost: ${this.formatNumber(totalCost)} gold</strong>
      </div>
    `;
  }
  costsBox.innerHTML = craftingCostsHTML;
}

// Add Discord bot data reception
ipcRenderer.on('discord-bot-data', (event, data) => {
  console.log('Received Discord bot data:', data);
  
  // If we have parsed events, auto-import them
  if (data.events && Array.isArray(data.events) && data.events.length > 0) {
    if (scheduleMaker) {
      console.log('Auto-importing Discord events:', data.events);
      scheduleMaker.autoImportDiscordEvents(data.events);
      scheduleMaker.showNotification(`Imported ${data.events.length} events from Discord bot`, 'success');
    } else {
      console.log('ScheduleMaker not available');
    }
  } else {
    console.log('No events found in Discord bot data or data format is incorrect');
    if (scheduleMaker) {
      scheduleMaker.showNotification('Discord bot data received but no events found', 'warning');
    }
  }
});

// Theme Management System
class ThemeManager {
  constructor() {
    this.currentTheme = 'purple';
    this.initializeTheme();
    this.setupThemeEventListeners();
  }

  initializeTheme() {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('app-theme') || 'purple';
    this.setTheme(savedTheme);
    
    // Update theme selector
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      themeSelector.value = savedTheme;
    }
  }

  setupThemeEventListeners() {
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      themeSelector.addEventListener('change', (e) => {
        const newTheme = e.target.value;
        this.setTheme(newTheme);
        this.updateThemePreview(newTheme);
      });
    }

    // Quick theme toggle button
    const quickThemeBtn = document.getElementById('quick-theme-toggle');
    if (quickThemeBtn) {
      quickThemeBtn.addEventListener('click', () => {
        this.cycleTheme();
      });
    }
  }

  cycleTheme() {
    const themes = ['purple', 'green', 'blue', 'orange', 'red', 'pink'];
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    
    this.setTheme(nextTheme);
    
    // Update theme selector if it exists
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      themeSelector.value = nextTheme;
    }
    
    // Show notification
    this.showThemeNotification(nextTheme);
  }

  showThemeNotification(themeName) {
    const themeNames = {
      purple: 'Purple Theme',
      green: 'Hunter Green Theme', 
      blue: 'Ocean Blue Theme',
      orange: 'Sunset Orange Theme',
      red: 'Crimson Red Theme',
      pink: 'Rose Pink Theme'
    };
    
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.textContent = `🎨 ${themeNames[themeName]}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 4px 12px var(--shadow-color);
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 2 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  setTheme(themeName) {
    // Remove all existing theme classes
    document.body.classList.remove('theme-purple', 'theme-green', 'theme-blue', 'theme-orange', 'theme-red', 'theme-pink');
    
    // Add new theme class
    document.body.classList.add(`theme-${themeName}`);
    
    // Save theme preference
    localStorage.setItem('app-theme', themeName);
    this.currentTheme = themeName;
    
    // Update theme preview
    this.updateThemePreview(themeName);
    
    console.log(`Theme changed to: ${themeName}`);
  }

  updateThemePreview(themeName) {
    const preview = document.getElementById('theme-preview');
    if (!preview) return;

    const previewHeader = preview.querySelector('.preview-header');
    const previewButton = preview.querySelector('.preview-button');
    const previewInput = preview.querySelector('.preview-input');

    // Get theme colors
    const colors = this.getThemeColors(themeName);

    if (previewHeader) {
      previewHeader.style.color = colors.primary;
      previewHeader.style.background = colors.primaryLight + '20';
      previewHeader.style.borderColor = colors.primary + '40';
    }

    if (previewButton) {
      previewButton.style.background = `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`;
      previewButton.style.boxShadow = `0 4px 12px ${colors.primary}40`;
    }

    if (previewInput) {
      previewInput.style.borderColor = colors.primary + '40';
    }
  }

  getThemeColors(themeName) {
    const themes = {
      purple: {
        primary: '#9370db',
        primaryLight: '#ba55d3',
        primaryDark: '#663399',
        accent: '#dda0dd'
      },
      green: {
        primary: '#228b22',
        primaryLight: '#32cd32',
        primaryDark: '#006400',
        accent: '#90ee90'
      },
      blue: {
        primary: '#1e90ff',
        primaryLight: '#87cefa',
        primaryDark: '#0066cc',
        accent: '#b0e0e6'
      },
      orange: {
        primary: '#ff8c00',
        primaryLight: '#ffa500',
        primaryDark: '#cc6600',
        accent: '#ffcc99'
      },
      red: {
        primary: '#dc143c',
        primaryLight: '#ff6347',
        primaryDark: '#8b0000',
        accent: '#ffb6c1'
      },
      pink: {
        primary: '#ff69b4',
        primaryLight: '#ffb6c1',
        primaryDark: '#c71585',
        accent: '#f0b6d5'
      }
    };

    return themes[themeName] || themes.purple;
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// NW Buddy Integration Manager
class NWBuddyManager {
  constructor() {
    this.nwbuddyPath = null;
    this.version = null;
    this.isRunning = false;
    this.processId = null;
    this.statusCheckInterval = null;
    this.initializeNWBuddy();
    this.setupEventListeners();
    this.startStatusMonitoring();
  }

  async initializeNWBuddy() {
    try {
      // Check if NW Buddy executable exists
      const result = await ipcRenderer.invoke('check-nwbuddy');
      
      if (result.exists) {
        this.nwbuddyPath = result.path;
        this.version = result.version;
        this.updateUI(true);
        this.updateNWBUIToAvailable();
        this.addLogEntry(`NW Buddy initialized: v${result.version}`, 'success');
        
        // Auto-load NW Buddy iframe since NWB tab is active by default
        this.autoLoadNWBuddy();
      } else {
        this.updateUI(false);
        this.updateNWBUIToUnavailable();
        this.addLogEntry('NW Buddy not found during initialization', 'warning');
      }
    } catch (error) {
      console.error('Failed to initialize NW Buddy:', error);
      this.updateUI(false);
      this.updateNWBUIToUnavailable();
      this.addLogEntry(`Initialization failed: ${error.message}`, 'error');
    }
  }

  setupEventListeners() {
    // Settings page event listeners
    const downloadBtn = document.getElementById('download-nwbuddy');
    const launchBtn = document.getElementById('launch-nwbuddy');
    const autoLaunchCheckbox = document.getElementById('auto-launch-nwbuddy');

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadNWBuddy();
      });
    }

    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        this.launchNWBuddy();
      });
    }

    if (autoLaunchCheckbox) {
      autoLaunchCheckbox.addEventListener('change', (e) => {
        this.setAutoLaunch(e.target.checked);
      });
    }

    // NWB tab event listeners
    const nwbLaunchBtn = document.getElementById('launch-nwbuddy-btn');
    const nwbDownloadBtn = document.getElementById('download-nwbuddy-btn');
    const nwbCheckBtn = document.getElementById('check-nwbuddy-btn');
    const clearLogBtn = document.getElementById('clear-log-btn');
    const openGearsetsBtn = document.getElementById('open-gearsets-btn');
    const openCraftingBtn = document.getElementById('open-crafting-btn');
    const openTrackingBtn = document.getElementById('open-tracking-btn');
    const openPricesBtn = document.getElementById('open-prices-btn');

    if (nwbLaunchBtn) {
      nwbLaunchBtn.addEventListener('click', () => {
        this.launchNWBuddy();
      });
    }

    if (nwbDownloadBtn) {
      nwbDownloadBtn.addEventListener('click', () => {
        this.downloadNWBuddy();
      });
    }

    if (nwbCheckBtn) {
      nwbCheckBtn.addEventListener('click', () => {
        this.checkNWBuddyStatus();
      });
    }

    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        this.clearLog();
      });
    }

    if (openGearsetsBtn) {
      openGearsetsBtn.addEventListener('click', () => {
        this.openNWBuddySection('gearsets');
      });
    }

    if (openCraftingBtn) {
      openCraftingBtn.addEventListener('click', () => {
        this.openNWBuddySection('crafting');
      });
    }

    if (openTrackingBtn) {
      openTrackingBtn.addEventListener('click', () => {
        this.openNWBuddySection('tracking');
      });
    }

    if (openPricesBtn) {
      openPricesBtn.addEventListener('click', () => {
        this.openNWBuddySection('prices');
      });
    }

    // Toggle integration panel button
    const toggleIntegrationPanelBtn = document.getElementById('toggle-integration-panel-btn');
    if (toggleIntegrationPanelBtn) {
      toggleIntegrationPanelBtn.addEventListener('click', () => {
        this.toggleIntegrationPanel();
      });
    }

    // Embedded view event listeners
    const toggleViewBtn = document.getElementById('toggle-nwbuddy-view-btn');
    const placeholderLaunchBtn = document.getElementById('launch-nwbuddy-placeholder-btn');

    if (toggleViewBtn) {
      toggleViewBtn.addEventListener('click', () => {
        this.toggleNWBuddyView();
      });
    }

    if (placeholderLaunchBtn) {
      placeholderLaunchBtn.addEventListener('click', () => {
        this.launchNWBuddy();
      });
    }
  }

  updateUI(exists) {
    const statusText = document.querySelector('#nwbuddy-status .status-text');
    const downloadBtn = document.getElementById('download-nwbuddy');
    const launchBtn = document.getElementById('launch-nwbuddy');
    const versionSpan = document.getElementById('nwbuddy-version');

    if (exists) {
      statusText.textContent = '✅ Available';
      statusText.className = 'status-text available';
      downloadBtn.style.display = 'none';
      launchBtn.style.display = 'inline-block';
      
      if (versionSpan && this.version) {
        versionSpan.textContent = this.version;
      }
    } else {
      statusText.textContent = '❌ Not found';
      statusText.className = 'status-text unavailable';
      downloadBtn.style.display = 'inline-block';
      launchBtn.style.display = 'none';
      
      if (versionSpan) {
        versionSpan.textContent = 'Not installed';
      }
    }
  }

  async downloadNWBuddy() {
    try {
      const downloadBtn = document.getElementById('download-nwbuddy');
      const originalText = downloadBtn.textContent;
      
      downloadBtn.textContent = '📥 Downloading...';
      downloadBtn.disabled = true;

      const result = await ipcRenderer.invoke('download-nwbuddy');
      
      if (result.success) {
        this.nwbuddyPath = result.path;
        this.version = result.version;
        this.updateUI(true);
        this.showNotification('NW Buddy downloaded successfully!', 'success');
      } else {
        this.showNotification(`Failed to download NW Buddy: ${result.error}`, 'error');
      }
    } catch (error) {
      this.showNotification(`Download failed: ${error.message}`, 'error');
    } finally {
      const downloadBtn = document.getElementById('download-nwbuddy');
      downloadBtn.textContent = '📥 Download NW Buddy';
      downloadBtn.disabled = false;
    }
  }

  toggleIntegrationPanel() {
    const controlPanel = document.getElementById('nwbuddy-control-panel');
    const iframeContainer = document.getElementById('nwbuddy-iframe-container');
    const iframe = document.getElementById('nwbuddy-iframe');
    const toggleBtn = document.getElementById('toggle-integration-panel-btn');
    
    if (controlPanel && iframeContainer && iframe && toggleBtn) {
      const isVisible = controlPanel.style.display !== 'none';
      
      if (isVisible) {
        // Hide the control panel
        controlPanel.style.display = 'none';
        toggleBtn.textContent = '⚙️ Show Integration Panel';
        
        // Make iframe bigger
        iframeContainer.style.height = '90vh';
        iframe.style.height = '90vh';
        
        this.addLogEntry('Integration panel hidden, NW Buddy expanded', 'info');
      } else {
        // Show the control panel
        controlPanel.style.display = 'block';
        toggleBtn.textContent = '⚙️ Hide Integration Panel';
        
        // Make iframe smaller
        iframeContainer.style.height = '70vh';
        iframe.style.height = '70vh';
        
        this.addLogEntry('Integration panel shown, NW Buddy resized', 'info');
      }
    }
  }

  autoLoadNWBuddy() {
    console.log('Auto-loading NW Buddy iframe...');
    
    try {
      // Show the iframe container and hide placeholder
      const iframeContainer = document.querySelector('.nwbuddy-view-container .iframe-container');
      const placeholder = document.querySelector('.nwbuddy-view-placeholder');
      
      if (iframeContainer) {
        iframeContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        
        // Get the iframe and ensure it's loaded
        const iframe = document.getElementById('nwbuddy-iframe');
        if (iframe) {
          // Set the iframe source if not already set
          if (!iframe.src || iframe.src === 'about:blank') {
            iframe.src = 'https://www.nw-buddy.de/';
          }
          
          iframe.onload = () => {
            console.log('NW Buddy iframe auto-loaded successfully');
            this.addLogEntry('NW Buddy web app auto-loaded successfully', 'success');
            
            // Update UI to show the embedded view is available
            this.updateEmbeddedViewUI(true);
            this.isRunning = true;
            this.updateNWBUIToAvailable();
            this.updateToggleButtonText(true);
          };
        }
      }
    } catch (error) {
      console.error('Auto-load NW Buddy error:', error);
      this.addLogEntry(`Auto-load failed: ${error.message}`, 'error');
    }
  }

  async launchNWBuddy() {
    console.log('launchNWBuddy called - using iframe approach');
    
    try {
      // Show the iframe container and hide placeholder
      const iframeContainer = document.querySelector('.nwbuddy-view-container .iframe-container');
      const placeholder = document.querySelector('.nwbuddy-view-placeholder');
      
      if (iframeContainer) {
        iframeContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        
        // Get the iframe and ensure it's loaded
        const iframe = document.getElementById('nwbuddy-iframe');
        if (iframe) {
          // Reload the iframe to ensure fresh content
          iframe.src = 'https://www.nw-buddy.de/';
          
          iframe.onload = () => {
            console.log('NW Buddy iframe loaded successfully');
            this.showNotification('NW Buddy web app loaded successfully!', 'success');
            this.addLogEntry('NW Buddy web app loaded successfully in iframe', 'success');
            
            // Update UI to show the embedded view is available
            this.updateEmbeddedViewUI(true);
            this.isRunning = true;
            this.updateNWBUIToAvailable();
            this.updateToggleButtonText(true);
          };
        }
      }
    } catch (error) {
      console.error('Launch NW Buddy error:', error);
      this.showNotification(`Load failed: ${error.message}`, 'error');
      this.addLogEntry(`Load failed: ${error.message}`, 'error');
    }
  }

  async toggleNWBuddyView() {
    try {
      const iframeContainer = document.querySelector('.nwbuddy-view-container .iframe-container');
      const placeholder = document.querySelector('.nwbuddy-view-placeholder');
      
      if (iframeContainer && iframeContainer.style.display === 'block') {
        // Hide the iframe
        iframeContainer.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        this.addLogEntry('NW Buddy iframe hidden', 'info');
        this.updateToggleButtonText(false);
      } else {
        // Show the iframe
        if (iframeContainer) iframeContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        this.addLogEntry('NW Buddy iframe shown', 'info');
        this.updateToggleButtonText(true);
      }
    } catch (error) {
      this.addLogEntry(`Toggle view failed: ${error.message}`, 'error');
    }
  }

  updateEmbeddedViewUI(isAvailable) {
    const toggleBtn = document.getElementById('toggle-nwbuddy-view-btn');
    const placeholder = document.getElementById('nwbuddy-view-placeholder');
    
    if (toggleBtn) {
      toggleBtn.disabled = !isAvailable;
    }
    
    if (placeholder && isAvailable) {
      placeholder.style.display = 'none';
    } else if (placeholder && !isAvailable) {
      placeholder.style.display = 'flex';
    }
  }

  updateToggleButtonText(isVisible) {
    const toggleBtn = document.getElementById('toggle-nwbuddy-view-btn');
    if (toggleBtn) {
      toggleBtn.textContent = isVisible ? '👁️ Hide NW Buddy' : '👁️ Show NW Buddy';
    }
  }

  async setAutoLaunch(enabled) {
    try {
      await ipcRenderer.invoke('set-auto-launch-nwbuddy', enabled);
      this.showNotification(
        enabled ? 'Auto-launch enabled' : 'Auto-launch disabled', 
        'info'
      );
    } catch (error) {
      this.showNotification(`Failed to set auto-launch: ${error.message}`, 'error');
    }
  }

  showNotification(message, type = 'info') {
    // Use the existing notification system
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  startStatusMonitoring() {
    // Check status every 10 seconds
    this.statusCheckInterval = setInterval(async () => {
      if (this.isRunning) {
        try {
          const processResult = await ipcRenderer.invoke('check-nwbuddy-process');
          const wasRunning = this.isRunning;
          this.isRunning = processResult.running;
          
          if (wasRunning && !this.isRunning) {
            this.addLogEntry('NW Buddy process stopped', 'warning');
            this.updateNWBUIToAvailable(); // Update UI to show not running
          } else if (!wasRunning && this.isRunning) {
            this.addLogEntry('NW Buddy process started', 'success');
            this.updateNWBUIToAvailable(); // Update UI to show running
          }
        } catch (error) {
          console.error('Status monitoring error:', error);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  stopStatusMonitoring() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  // New methods for NWB tab integration
  async checkNWBuddyStatus() {
    this.addLogEntry('Checking NW Buddy status...', 'info');
    
    try {
      const result = await ipcRenderer.invoke('check-nwbuddy');
      
      if (result.exists) {
        this.nwbuddyPath = result.path;
        this.version = result.version;
        
        // Also check if the process is running
        const processResult = await ipcRenderer.invoke('check-nwbuddy-process');
        this.isRunning = processResult.running;
        this.processId = processResult.pid;
        
        this.updateNWBUIToAvailable();
        this.addLogEntry(`NW Buddy found: v${result.version}`, 'success');
        
        if (this.isRunning) {
          this.addLogEntry(`NW Buddy is running (ID: ${this.processId})`, 'success');
        } else {
          this.addLogEntry('NW Buddy is available but not running', 'info');
        }
      } else {
        this.updateNWBUIToUnavailable();
        this.addLogEntry('NW Buddy not found', 'warning');
      }
    } catch (error) {
      this.updateNWBUIToUnavailable();
      this.addLogEntry(`Status check failed: ${error.message}`, 'error');
    }
  }

  updateNWBUIToAvailable() {
    console.log('Renderer: updateNWBUIToAvailable called');
    const statusIndicator = document.getElementById('nwbuddy-app-status');
    const statusIcon = statusIndicator?.querySelector('.status-icon');
    const statusText = statusIndicator?.querySelector('.status-text');
    const launchBtn = document.getElementById('launch-nwbuddy-btn');
    const versionDisplay = document.getElementById('nwbuddy-version-display');
    const statusDisplay = document.getElementById('nwbuddy-status-display');
    const updatedDisplay = document.getElementById('nwbuddy-updated-display');
    const actionBtns = document.querySelectorAll('.action-btn');

    console.log('Renderer: UI elements found:', {
      statusIndicator: !!statusIndicator,
      statusIcon: !!statusIcon,
      statusText: !!statusText,
      launchBtn: !!launchBtn,
      versionDisplay: !!versionDisplay,
      statusDisplay: !!statusDisplay,
      updatedDisplay: !!updatedDisplay,
      actionBtnsCount: actionBtns.length
    });

    // Only update UI if elements are found (tab is visible)
    if (statusIcon) statusIcon.textContent = '✅';
    if (statusText) statusText.textContent = 'NW Buddy is available';
    if (launchBtn) launchBtn.disabled = false;
    if (versionDisplay) versionDisplay.textContent = this.version || 'Unknown';
    if (statusDisplay) statusDisplay.textContent = this.isRunning ? 'Running' : 'Ready';
    if (updatedDisplay) updatedDisplay.textContent = new Date().toLocaleDateString();

    actionBtns.forEach(btn => {
      btn.disabled = !this.isRunning;
    });

    // Update embedded view UI
    this.updateEmbeddedViewUI(this.isRunning);
    console.log('Renderer: updateNWBUIToAvailable completed');
  }

  updateNWBUIToUnavailable() {
    const statusIndicator = document.getElementById('nwbuddy-app-status');
    const statusIcon = statusIndicator?.querySelector('.status-icon');
    const statusText = statusIndicator?.querySelector('.status-text');
    const launchBtn = document.getElementById('launch-nwbuddy-btn');
    const versionDisplay = document.getElementById('nwbuddy-version-display');
    const statusDisplay = document.getElementById('nwbuddy-status-display');
    const actionBtns = document.querySelectorAll('.action-btn');

    if (statusIcon) statusIcon.textContent = '❌';
    if (statusText) statusText.textContent = 'NW Buddy not available';
    if (launchBtn) launchBtn.disabled = true;
    if (versionDisplay) versionDisplay.textContent = 'Not installed';
    if (statusDisplay) statusDisplay.textContent = 'Unavailable';

    actionBtns.forEach(btn => {
      btn.disabled = true;
    });

    // Update embedded view UI
    this.updateEmbeddedViewUI(false);
  }

  addLogEntry(message, type = 'info') {
    console.log(`Renderer: Adding log entry: [${type}] ${message}`);
    const logContainer = document.getElementById('nwbuddy-log');
    if (!logContainer) {
      console.warn('Renderer: Log container not found! (NWB tab might not be visible)');
      // Still log to console for debugging
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${message}`);
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    console.log('Renderer: Log entry added successfully');
  }

  clearLog() {
    const logContainer = document.getElementById('nwbuddy-log');
    if (logContainer) {
      logContainer.innerHTML = '<div class="log-entry">Log cleared...</div>';
    }
  }

  async openNWBuddySection(section) {
    this.addLogEntry(`Opening ${section} section...`, 'info');
    
    try {
      const iframe = document.getElementById('nwbuddy-iframe');
      if (!iframe) {
        this.addLogEntry('NW Buddy iframe not found', 'error');
        return;
      }
      
      // Define section URLs
      const sectionUrls = {
        gearsets: "https://www.nw-buddy.de/gearsets",
        crafting: "https://www.nw-buddy.de/crafting", 
        tracking: "https://www.nw-buddy.de/tracking",
        prices: "https://www.nw-buddy.de/market"
      };
      
      const url = sectionUrls[section];
      if (!url) {
        this.addLogEntry(`Unknown section: ${section}`, 'error');
        return;
      }
      
      // Navigate the iframe to the section
      iframe.src = url;
      
      // Show the iframe if it's hidden
      const iframeContainer = document.querySelector('.nwbuddy-view-container .iframe-container');
      if (iframeContainer) iframeContainer.style.display = 'block';
      
      this.addLogEntry(`${section} section opened successfully`, 'success');
    } catch (error) {
      this.addLogEntry(`Failed to open ${section}: ${error.message}`, 'error');
    }
  }

  // Override the existing methods to update the NWB tab UI
  async downloadNWBuddy() {
    this.addLogEntry('Starting NW Buddy download...', 'info');
    
    try {
      const downloadBtn = document.getElementById('download-nwbuddy-btn');
      const originalText = downloadBtn?.textContent;
      
      if (downloadBtn) {
        downloadBtn.textContent = '📥 Downloading...';
        downloadBtn.disabled = true;
      }

      const result = await ipcRenderer.invoke('download-nwbuddy');
      
      if (result.success) {
        this.nwbuddyPath = result.path;
        this.version = result.version;
        this.updateNWBUIToAvailable();
        this.addLogEntry('NW Buddy downloaded successfully!', 'success');
        this.showNotification('NW Buddy downloaded successfully!', 'success');
      } else {
        this.addLogEntry(`Download failed: ${result.error}`, 'error');
        this.showNotification(`Failed to download NW Buddy: ${result.error}`, 'error');
      }
    } catch (error) {
      this.addLogEntry(`Download failed: ${error.message}`, 'error');
      this.showNotification(`Download failed: ${error.message}`, 'error');
    } finally {
      const downloadBtn = document.getElementById('download-nwbuddy-btn');
      if (downloadBtn) {
        downloadBtn.textContent = '📥 Download NW Buddy';
        downloadBtn.disabled = false;
      }
    }
  }

  async launchNWBuddy() {
    console.log('Renderer: launchNWBuddy called - using iframe approach');
    this.addLogEntry('Loading NW Buddy in iframe...', 'info');
    
    try {
      // Show the iframe container and hide placeholder
      const iframeContainer = document.querySelector('.nwbuddy-view-container .iframe-container');
      const placeholder = document.querySelector('.nwbuddy-view-placeholder');
      
      if (iframeContainer) {
        iframeContainer.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';
        
        // Get the iframe and ensure it's loaded
        const iframe = document.getElementById('nwbuddy-iframe');
        if (iframe) {
          // Reload the iframe to ensure fresh content
          iframe.src = 'https://www.nw-buddy.de/';
          
          iframe.onload = () => {
            console.log('Renderer: NW Buddy iframe loaded successfully');
            this.isRunning = true;
            this.updateNWBUIToAvailable();
            this.addLogEntry('NW Buddy loaded successfully in iframe', 'success');
            this.showNotification('NW Buddy loaded successfully!', 'success');
            
            // Enable action buttons now that NW Buddy is running
            const actionBtns = document.querySelectorAll('.action-btn');
            actionBtns.forEach(btn => {
              btn.disabled = false;
            });
            console.log('Renderer: UI updated successfully');
          };
        }
      }
    } catch (error) {
      console.error('Renderer: Launch error:', error);
      this.addLogEntry(`Load failed: ${error.message}`, 'error');
      this.showNotification(`Load failed: ${error.message}`, 'error');
    }
  }
}

// Initialize Theme Manager
let themeManager;
let clipboardManager;
let nwbuddyManager;
document.addEventListener('DOMContentLoaded', () => {
  themeManager = new ThemeManager();
  clipboardManager = new ClipboardManager();
  nwbuddyManager = new NWBuddyManager();
  
  // Initialize NWB tab when shown
  const nwbTab = document.querySelector('[data-tab="nwb"]');
  if (nwbTab) {
    nwbTab.addEventListener('click', () => {
      // Small delay to ensure tab content is visible
      setTimeout(() => {
        console.log('Renderer: NWB tab clicked, checking status...');
        nwbuddyManager.checkNWBuddyStatus();
      }, 100);
    });
  }
  
  // Also initialize if NWB tab is already active (for testing)
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab && activeTab.dataset.tab === 'nwb') {
    console.log('Renderer: NWB tab is active by default, checking status...');
    setTimeout(() => {
      nwbuddyManager.checkNWBuddyStatus();
    }, 100);
  }
});
