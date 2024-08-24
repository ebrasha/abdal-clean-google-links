function cleanGoogleLink(link) {
    const url = new URL(link.href);

    if (url.hostname === 'www.google.com' && url.searchParams.has('url')) {
        link.href = url.searchParams.get('url');
    }
}

function cleanAllLinks() {
    const links = document.querySelectorAll('a');
    links.forEach(link => cleanGoogleLink(link));
}

// Clean links when the page content is fully loaded
document.addEventListener('DOMContentLoaded', cleanAllLinks);

// Observe the DOM for any changes and clean new or modified links
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
            cleanAllLinks();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
});
