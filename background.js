/*
 **********************************************************************
 * -------------------------------------------------------------------
 * Project Name : Abdal Clean Google Links
 * File Name    : background.js
 * Author       : Ebrahim Shafiei (EbraSha)
 * Email        : Prof.Shafiei@Gmail.com
 * Created On   : 2024-12-19 15:30:00
 * Description  : Background script for Firefox extension that cleans Google search result URLs
 * -------------------------------------------------------------------
 *
 * "Coding is an engaging and beloved hobby for me. I passionately and insatiably pursue knowledge in cybersecurity and programming."
 * – Ebrahim Shafiei
 *
 **********************************************************************
 */

/**
 * Configuration object for the extension
 */
const CONFIG = {
    // Google domains that are supported
    GOOGLE_DOMAINS: [
        'google.com', 'google.co.uk', 'google.de', 'google.fr', 'google.it',
        'google.es', 'google.ca', 'google.com.au', 'google.co.jp', 'google.co.in',
        'google.com.br', 'google.ru', 'google.cn'
    ],
    
    // Tracking parameters to remove from URLs
    TRACKING_PARAMS: [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'gclid', 'gclsrc', 'dclid', 'fbclid', 'msclkid', 'ref', 'source',
        'si', 'ved', 'ei', 'oq', 'gs_lcp', 'sclient', 'ved', 'uact',
        'usg', 'sa', 's', 'q', 'oq', 'aqs', 'sourceid', 'ie', 'cd',
        'ved', 'ahUKEwj', 'bih', 'biw', 'client', 'safari', 'chrome'
    ],
    
    // Context menu settings
    CONTEXT_MENU: {
        id: 'copy-clean-link',
        title: 'Copy Clean Link (Abdal)',
        contexts: ['link']
    }
};

/**
 * Utility class for URL manipulation and validation
 */
class URLUtils {
    /**
     * Checks if a URL is from a Google domain
     * @param {string} url - The URL to check
     * @returns {boolean} - True if the URL is from a Google domain
     */
    static isGoogleDomain(url) {
        try {
            const urlObj = new URL(url);
            return CONFIG.GOOGLE_DOMAINS.some(domain => 
                urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );
        } catch (error) {
            console.error('Error checking Google domain:', error);
            return false;
        }
    }

    /**
     * Extracts the target URL from Google search result links
     * @param {string} url - The Google search result URL
     * @returns {string|null} - The cleaned target URL or null if not found
     */
    static extractTargetURL(url) {
        try {
            const urlObj = new URL(url);
            
            // Check for direct URL parameter (common in Google search results)
            if (urlObj.searchParams.has('url')) {
                return urlObj.searchParams.get('url');
            }
            
            // Check for q parameter (search query that might be a URL)
            if (urlObj.searchParams.has('q')) {
                const query = urlObj.searchParams.get('q');
                if (this.isValidURL(query)) {
                    return query;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting target URL:', error);
            return null;
        }
    }

    /**
     * Validates if a string is a valid URL
     * @param {string} urlString - The string to validate
     * @returns {boolean} - True if the string is a valid URL
     */
    static isValidURL(urlString) {
        try {
            new URL(urlString);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Removes tracking parameters from a URL
     * @param {string} url - The URL to clean
     * @returns {string} - The cleaned URL
     */
    static removeTrackingParams(url) {
        try {
            const urlObj = new URL(url);
            
            // Remove tracking parameters
            CONFIG.TRACKING_PARAMS.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            return urlObj.toString();
        } catch (error) {
            console.error('Error removing tracking parameters:', error);
            return url;
        }
    }
}

/**
 * Main URL cleaning function
 * @param {string} url - The URL to clean
 * @returns {string} - The cleaned URL
 */
function cleanGoogleLink(url) {
    try {
        // Validate input
        if (!url || typeof url !== 'string') {
            console.warn('Invalid URL provided:', url);
            return url;
        }

        // Check if it's a Google domain
        if (!URLUtils.isGoogleDomain(url)) {
            return url;
        }

        // Extract target URL from Google search result
        const targetURL = URLUtils.extractTargetURL(url);
        
        if (targetURL) {
            // Clean the target URL by removing tracking parameters
            return URLUtils.removeTrackingParams(targetURL);
        }

        // If no target URL found, clean the original URL
        return URLUtils.removeTrackingParams(url);
        
    } catch (error) {
        console.error('Error cleaning Google link:', error);
        return url;
    }
}

/**
 * Handles context menu clicks
 * @param {Object} info - Information about the context menu click
 * @param {Object} tab - The active tab
 */
function handleContextMenuClick(info, tab) {
    try {
        const cleanUrl = cleanGoogleLink(info.linkUrl);
        
        if (cleanUrl && cleanUrl !== info.linkUrl) {
            // Copy to clipboard using the old method for Manifest V2
            const textArea = document.createElement('textarea');
            textArea.value = cleanUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Show notification
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Abdal Clean Google Links',
                message: 'Clean URL copied to clipboard!'
            });
            
            console.log('Clean URL copied:', cleanUrl);
        } else {
            // Show notification that URL was already clean
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Abdal Clean Google Links',
                message: 'URL is already clean!'
            });
        }
    } catch (error) {
        console.error('Error handling context menu click:', error);
        
        // Fallback notification
        try {
            browser.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Abdal Clean Google Links',
                message: 'Error processing URL'
            });
        } catch (notificationError) {
            console.error('Error showing notification:', notificationError);
        }
    }
}

/**
 * Initializes the extension
 */
function initializeExtension() {
    try {
        // Create context menu
        browser.contextMenus.create({
            id: CONFIG.CONTEXT_MENU.id,
            title: CONFIG.CONTEXT_MENU.title,
            contexts: CONFIG.CONTEXT_MENU.contexts
        });

        // Add event listener for context menu clicks
        browser.contextMenus.onClicked.addListener(handleContextMenuClick);
        
        console.log('Abdal Clean Google Links extension initialized successfully');
        
    } catch (error) {
        console.error('Error initializing extension:', error);
    }
}

// Initialize the extension when the background script loads
initializeExtension();

// Handle installation and updates
browser.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // First time installation
        console.log('Welcome to Abdal Clean Google Links!');
    } else if (details.reason === 'update') {
        // Extension updated
        console.log('Abdal Clean Google Links updated to version 2.0.0');
    }
});

// Handle messages from content script or popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case 'cleanUrl':
                const cleanedUrl = cleanGoogleLink(message.url);
                sendResponse({ success: true, cleanedUrl });
                break;
                
            case 'getStats':
                // Return extension statistics
                sendResponse({ 
                    success: true, 
                    version: '2.0.0',
                    author: 'Ebrahim Shafiei (EbraSha)',
                    description: 'Enhanced Google URL cleaning for privacy'
                });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true; // Keep the message channel open for async response
});
