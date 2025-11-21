// Location Tracker for LexiGo - Shows user's location in navbar
class LocationTracker {
    constructor() {
        this.locationElement = null;
        this.cachedLocation = null;
        this.init();
    }

    init() {
        this.locationElement = document.getElementById('userLocation');
        if (!this.locationElement) {
            console.log('Location element not found');
            return;
        }

        // Check if location is cached in sessionStorage
        const cached = sessionStorage.getItem('lexigoLocation');
        if (cached) {
            try {
                this.cachedLocation = JSON.parse(cached);
                // Display cached location immediately
                this.displayLocation(this.cachedLocation);
                // Still fetch in background to update if needed
                this.fetchLocation();
                return;
            } catch (e) {
                console.warn('Failed to parse cached location', e);
                sessionStorage.removeItem('lexigoLocation');
            }
        }

        // Fetch location if not cached
        this.fetchLocation();
    }

    async fetchLocation() {
        // Show loading state
        if (this.locationElement) {
            this.locationElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span class="location-text">Detecting...</span>';
            this.locationElement.classList.add('loading');
        }

        try {
            // Try multiple free IP geolocation APIs
            const location = await this.tryFetchLocation();
            
            if (location) {
                this.cachedLocation = location;
                // Cache for session
                sessionStorage.setItem('lexigoLocation', JSON.stringify(location));
                this.displayLocation(location);
            } else {
                throw new Error('Failed to fetch location');
            }
        } catch (error) {
            console.warn('Location fetch failed:', error);
            this.displayFallback();
        }
    }

    async fetchWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async tryFetchLocation() {
        // Try ipapi.co first (free, no API key needed)
        try {
            const response = await this.fetchWithTimeout('https://ipapi.co/json/', 5000);
            if (response.ok) {
                const data = await response.json();
                if (data.city && data.country_name) {
                    return {
                        city: data.city,
                        country: data.country_name,
                        countryCode: data.country_code,
                        region: data.region,
                        flag: this.getCountryFlag(data.country_code)
                    };
                }
            }
        } catch (e) {
            console.log('ipapi.co failed, trying alternative...');
        }

        // Try ip-api.com as fallback
        try {
            const response = await this.fetchWithTimeout('https://ip-api.com/json/?fields=status,message,country,countryCode,city,regionName', 5000);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.city && data.country) {
                    return {
                        city: data.city,
                        country: data.country,
                        countryCode: data.countryCode,
                        region: data.regionName,
                        flag: this.getCountryFlag(data.countryCode)
                    };
                }
            }
        } catch (e) {
            console.log('ip-api.com failed, trying alternative...');
        }

        // Try geojs.io as another fallback
        try {
            const response = await this.fetchWithTimeout('https://get.geojs.io/v1/ip/geo.json', 5000);
            if (response.ok) {
                const data = await response.json();
                if (data.city && data.country) {
                    return {
                        city: data.city,
                        country: data.country,
                        countryCode: data.country_code,
                        region: data.region,
                        flag: this.getCountryFlag(data.country_code)
                    };
                }
            }
        } catch (e) {
            console.log('geojs.io failed');
        }

        return null;
    }

    getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '🌍';
        try {
            // Convert country code to flag emoji
            const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt());
            return String.fromCodePoint(...codePoints);
        } catch (e) {
            return '🌍';
        }
    }

    displayLocation(location) {
        if (!this.locationElement || !location) return;

        const { city, country, flag, region } = location;
        
        // Create a nice display
        let locationText = '';
        let fullLocation = '';
        
        if (city && country) {
            // Show city, country with flag
            locationText = `${flag || '📍'} ${city}, ${country}`;
            fullLocation = `${city}${region ? ', ' + region : ''}, ${country}`;
        } else if (country) {
            locationText = `${flag || '📍'} ${country}`;
            fullLocation = country;
        } else {
            locationText = '🌍 Global';
            fullLocation = 'Location';
        }

        this.locationElement.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <span class="location-text">${this.escapeHtml(locationText)}</span>
        `;
        this.locationElement.title = `Searching from ${fullLocation}`;
        this.locationElement.classList.remove('loading');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    displayFallback() {
        if (!this.locationElement) return;
        
        // Try to get timezone as fallback
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const parts = timezone.split('/');
            const location = parts[parts.length - 1].replace(/_/g, ' ');
            
            this.locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span class="location-text">🌍 ${this.escapeHtml(location)}</span>
            `;
            this.locationElement.title = `Timezone: ${timezone}`;
            this.locationElement.classList.remove('loading');
        } catch (e) {
            this.locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span class="location-text">🌍 Global</span>
            `;
            this.locationElement.title = 'Location unavailable';
            this.locationElement.classList.remove('loading');
        }
    }

    // Method to refresh location
    refresh() {
        sessionStorage.removeItem('lexigoLocation');
        this.fetchLocation();
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    window.lexigoLocation = new LocationTracker();
});

