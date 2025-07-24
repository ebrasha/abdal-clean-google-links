/*
 **********************************************************************
 * -------------------------------------------------------------------
 * Project Name : Abdal Clean Google Links
 * File Name    : content.js
 * Author       : Ebrahim Shafiei (EbraSha)
 * Email        : Prof.Shafiei@Gmail.com
 * Created On   : 2024-12-19 15:30:00
 * Description  : Content script for cleaning Google search result URLs in real-time
 * -------------------------------------------------------------------
 *
 * "Coding is an engaging and beloved hobby for me. I passionately and insatiably pursue knowledge in cybersecurity and programming."
 * – Ebrahim Shafiei
 *
 **********************************************************************
 */

/**
 * Configuration object for the content script
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
    
    // Selectors for Google search result links
    SELECTORS: {
        SEARCH_RESULTS: 'a[href*="google.com/url"], a[href*="google.co.uk/url"], a[href*="google.de/url"]',
        SEARCH_RESULT_LINKS: 'div[data-ved] a[href], .g a[href], .rc a[href], .yuRUbf a[href], .LC20lb a[href]',
        NAVIGATION_LINKS: 'nav a[href], .fl a[href], .nBDE1b a[href], .AaVjTc a[href], .SJajHc a[href]',
        ALL_LINKS: 'a[href]'
    },
    
    // Performance settings
    PERFORMANCE: {
        DEBOUNCE_DELAY: 100, // milliseconds
        MAX_LINKS_PER_BATCH: 50,
        OBSERVER_THROTTLE: 250 // milliseconds
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
 * Checks if a link should be cleaned (excludes navigation and pagination links)
 * @param {HTMLAnchorElement} link - The link element to check
 * @returns {boolean} - True if the link should be cleaned
 */
function shouldCleanLink(link) {
    try {
        // Don't clean navigation links
        if (link.closest('nav') || link.closest('.fl') || link.closest('.nBDE1b') || 
            link.closest('.AaVjTc') || link.closest('.SJajHc')) {
            return false;
        }
        
        // Don't clean pagination links (next, previous, page numbers)
        const href = link.href.toLowerCase();
        const text = link.textContent.toLowerCase();
        
        if (href.includes('search?') && (href.includes('start=') || href.includes('page='))) {
            return false;
        }
        
        if (text.includes('next') || text.includes('previous') || text.includes('page') || 
            text.match(/^\d+$/) || text.includes('»') || text.includes('«')) {
            return false;
        }
        
        // Don't clean Google's own navigation links
        if (href.includes('google.com/search') && !href.includes('/url?')) {
            return false;
        }
        
        // Only clean links that are likely search results
        return link.closest('[data-ved]') || link.closest('.g') || link.closest('.rc') || 
               link.closest('.yuRUbf') || link.closest('.LC20lb') || href.includes('/url?');
        
    } catch (error) {
        console.error('Error checking if link should be cleaned:', error);
        return false;
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
 * Cleans a single link element
 * @param {HTMLAnchorElement} link - The link element to clean
 * @returns {boolean} - True if the link was cleaned
 */
function cleanLink(link) {
    try {
        // Check if this link should be cleaned
        if (!shouldCleanLink(link)) {
            return false;
        }
        
        const originalHref = link.href;
        const cleanedHref = cleanGoogleLink(originalHref);
        
        if (cleanedHref && cleanedHref !== originalHref) {
            // Store original href as data attribute for reference
            link.setAttribute('data-original-href', originalHref);
            link.href = cleanedHref;
            
            // Add visual indicator that link was cleaned
            link.style.borderLeft = '3px solid #4CAF50';
            link.style.paddingLeft = '5px';
            
            console.log('Cleaned link:', originalHref, '→', cleanedHref);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error cleaning link:', error);
        return false;
    }
}

/**
 * Cleans all links in the document
 * @param {NodeList|Array} links - Collection of link elements to clean
 */
function cleanAllLinks(links = null) {
    try {
        // Use more specific selector for search result links
        const linksToClean = links || document.querySelectorAll(CONFIG.SELECTORS.SEARCH_RESULT_LINKS);
        let processedCount = 0;
        let cleanedCount = 0;
        
        // Process links in batches for better performance
        const processBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + CONFIG.PERFORMANCE.MAX_LINKS_PER_BATCH, linksToClean.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const link = linksToClean[i];
                if (link && link.href) {
                    const wasCleaned = cleanLink(link);
                    if (wasCleaned) cleanedCount++;
                    processedCount++;
                }
            }
            
            // Process next batch if there are more links
            if (endIndex < linksToClean.length) {
                setTimeout(() => processBatch(endIndex), 10);
            } else {
                console.log(`Abdal Clean Google Links: Processed ${processedCount} links, cleaned ${cleanedCount} links`);
            }
        };
        
        if (linksToClean.length > 0) {
            processBatch(0);
        }
        
    } catch (error) {
        console.error('Error cleaning all links:', error);
    }
}

/**
 * Debounced function to prevent excessive calls
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Optimized mutation observer for detecting new links
 */
class LinkObserver {
    constructor() {
        this.observer = null;
        this.debouncedClean = debounce(this.cleanNewLinks.bind(this), CONFIG.PERFORMANCE.DEBOUNCE_DELAY);
        this.lastCleanTime = 0;
    }

    /**
     * Cleans newly added links
     * @param {Array} mutations - Array of mutation records
     */
    cleanNewLinks(mutations) {
        try {
            const now = Date.now();
            if (now - this.lastCleanTime < CONFIG.PERFORMANCE.OBSERVER_THROTTLE) {
                return; // Throttle to prevent excessive processing
            }
            
            const newLinks = [];
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the added node is a link and should be cleaned
                            if (node.tagName === 'A' && node.href && shouldCleanLink(node)) {
                                newLinks.push(node);
                            }
                            
                            // Check for links within the added node
                            const links = node.querySelectorAll && node.querySelectorAll('a[href]');
                            if (links) {
                                const filteredLinks = Array.from(links).filter(link => shouldCleanLink(link));
                                newLinks.push(...filteredLinks);
                            }
                        }
                    });
                }
            });
            
            if (newLinks.length > 0) {
                this.lastCleanTime = now;
                cleanAllLinks(newLinks);
            }
            
        } catch (error) {
            console.error('Error cleaning new links:', error);
        }
    }

    /**
     * Starts observing the document for changes
     */
    start() {
        try {
            if (this.observer) {
                this.observer.disconnect();
            }
            
            this.observer = new MutationObserver(this.debouncedClean);
            
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false // Only observe child list changes for better performance
            });
            
            console.log('Abdal Clean Google Links: DOM observer started');
            
        } catch (error) {
            console.error('Error starting DOM observer:', error);
        }
    }

    /**
     * Stops observing the document
     */
    stop() {
        try {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
                console.log('Abdal Clean Google Links: DOM observer stopped');
            }
        } catch (error) {
            console.error('Error stopping DOM observer:', error);
        }
    }
}

/**
 * Main content script class
 */
class AbdalCleanGoogleLinks {
    constructor() {
        this.linkObserver = new LinkObserver();
        this.isInitialized = false;
    }

    /**
     * Initializes the content script
     */
    init() {
        try {
            if (this.isInitialized) {
                return;
            }

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
            
        } catch (error) {
            console.error('Error initializing Abdal Clean Google Links:', error);
        }
    }

    /**
     * Sets up the content script functionality
     */
    setup() {
        try {
            // Clean existing links
            cleanAllLinks();
            
            // Start observing for new links
            this.linkObserver.start();
            
            // Handle dynamic content loading (e.g., infinite scroll)
            this.handleDynamicContent();
            
            this.isInitialized = true;
            console.log('Abdal Clean Google Links: Content script initialized successfully');
            
        } catch (error) {
            console.error('Error setting up Abdal Clean Google Links:', error);
        }
    }

    /**
     * Handles dynamic content loading scenarios
     */
    handleDynamicContent() {
        try {
            // Listen for scroll events to handle infinite scroll
            let scrollTimeout;
            window.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    // Check for new links after scrolling (only search result links)
                    const newLinks = document.querySelectorAll(CONFIG.SELECTORS.SEARCH_RESULT_LINKS + ':not([data-original-href])');
                    if (newLinks.length > 0) {
                        cleanAllLinks(newLinks);
                    }
                }, 500);
            });
            
            // Handle AJAX content loading
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function(...args) {
                originalPushState.apply(history, args);
                setTimeout(() => cleanAllLinks(), 100);
            };
            
            history.replaceState = function(...args) {
                originalReplaceState.apply(history, args);
                setTimeout(() => cleanAllLinks(), 100);
            };
            
        } catch (error) {
            console.error('Error handling dynamic content:', error);
        }
    }

    /**
     * Cleans up resources
     */
    destroy() {
        try {
            this.linkObserver.stop();
            this.isInitialized = false;
            console.log('Abdal Clean Google Links: Content script destroyed');
        } catch (error) {
            console.error('Error destroying Abdal Clean Google Links:', error);
        }
    }
}

// Initialize the content script
const abdalCleaner = new AbdalCleanGoogleLinks();
abdalCleaner.init();

// Handle page unload
window.addEventListener('beforeunload', () => {
    abdalCleaner.destroy();
});

// Handle messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case 'cleanCurrentPage':
                cleanAllLinks();
                sendResponse({ success: true, message: 'Page links cleaned' });
                break;
                
            case 'getStats':
                const searchResultLinks = document.querySelectorAll(CONFIG.SELECTORS.SEARCH_RESULT_LINKS);
                const cleanedLinks = document.querySelectorAll('a[data-original-href]');
                sendResponse({ 
                    success: true, 
                    totalLinks: searchResultLinks.length,
                    cleanedLinks: cleanedLinks.length
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
