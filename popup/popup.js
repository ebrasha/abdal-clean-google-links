/*
 **********************************************************************
 * -------------------------------------------------------------------
 * Project Name : Abdal Clean Google Links
 * File Name    : popup.js
 * Author       : Ebrahim Shafiei (EbraSha)
 * Email        : Prof.Shafiei@Gmail.com
 * Created On   : 2024-12-19 15:30:00
 * Description  : Popup script for managing user interface and interactions
 * -------------------------------------------------------------------
 *
 * "Coding is an engaging and beloved hobby for me. I passionately and insatiably pursue knowledge in cybersecurity and programming."
 * – Ebrahim Shafiei
 *
 **********************************************************************
 */

/**
 * Popup management class
 */
class PopupManager {
    constructor() {
        this.elements = {};
        this.init();
    }

    /**
     * Initializes the popup
     */
    init() {
        try {
            this.cacheElements();
            this.bindEvents();
            this.loadInitialData();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    /**
     * Caches DOM elements for better performance
     */
    cacheElements() {
        this.elements = {
            totalLinks: document.getElementById('total-links'),
            cleanedLinks: document.getElementById('cleaned-links'),
            cleanNowBtn: document.getElementById('clean-now'),
            refreshStatsBtn: document.getElementById('refresh-stats')
        };
    }

    /**
     * Binds event listeners to UI elements
     */
    bindEvents() {
        // Clean current page button
        this.elements.cleanNowBtn.addEventListener('click', () => {
            this.cleanCurrentPage();
        });

        // Refresh statistics button
        this.elements.refreshStatsBtn.addEventListener('click', () => {
            this.refreshStatistics();
        });
    }

    /**
     * Loads initial data when popup opens
     */
    async loadInitialData() {
        try {
            await this.refreshStatistics();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Refreshes statistics from the current page
     */
    async refreshStatistics() {
        try {
            // Get current active tab
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.updateStats(0, 0);
                return;
            }

            // Check if we're on a Google domain
            const isGoogleDomain = this.isGoogleDomain(tab.url);
            
            if (!isGoogleDomain) {
                this.updateStats(0, 0);
                return;
            }

            // Get statistics from content script
            const response = await browser.tabs.sendMessage(tab.id, { action: 'getStats' });
            
            if (response && response.success) {
                this.updateStats(response.totalLinks, response.cleanedLinks);
            } else {
                this.updateStats(0, 0);
            }
            
        } catch (error) {
            console.error('Error refreshing statistics:', error);
            this.updateStats(0, 0);
        }
    }

    /**
     * Cleans the current page
     */
    async cleanCurrentPage() {
        try {
            this.elements.cleanNowBtn.disabled = true;
            this.elements.cleanNowBtn.textContent = 'Cleaning...';
            
            // Get current active tab
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                this.resetButton();
                return;
            }

            // Check if we're on a Google domain
            const isGoogleDomain = this.isGoogleDomain(tab.url);
            
            if (!isGoogleDomain) {
                this.resetButton();
                return;
            }

            // Send clean command to content script
            const response = await browser.tabs.sendMessage(tab.id, { action: 'cleanCurrentPage' });
            
            if (response && response.success) {
                // Refresh statistics after cleaning
                setTimeout(() => this.refreshStatistics(), 500);
            }
            
            this.resetButton();
            
        } catch (error) {
            console.error('Error cleaning current page:', error);
            this.resetButton();
        }
    }

    /**
     * Resets the clean button to its original state
     */
    resetButton() {
        this.elements.cleanNowBtn.disabled = false;
        this.elements.cleanNowBtn.textContent = 'Clean Current Page';
    }

    /**
     * Checks if a URL is from a Google domain
     * @param {string} url - The URL to check
     * @returns {boolean} - True if the URL is from a Google domain
     */
    isGoogleDomain(url) {
        try {
            const urlObj = new URL(url);
            const googleDomains = [
                'google.com', 'google.co.uk', 'google.de', 'google.fr', 'google.it',
                'google.es', 'google.ca', 'google.com.au', 'google.co.jp', 'google.co.in',
                'google.com.br', 'google.ru', 'google.cn'
            ];
            
            return googleDomains.some(domain => 
                urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
            );
        } catch (error) {
            console.error('Error checking Google domain:', error);
            return false;
        }
    }

    /**
     * Updates the statistics display
     * @param {number} totalLinks - Total number of links
     * @param {number} cleanedLinks - Number of cleaned links
     */
    updateStats(totalLinks, cleanedLinks) {
        this.elements.totalLinks.textContent = totalLinks || 0;
        this.elements.cleanedLinks.textContent = cleanedLinks || 0;
    }
}

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.popupManager = new PopupManager();
    } catch (error) {
        console.error('Error creating popup manager:', error);
    }
}); 