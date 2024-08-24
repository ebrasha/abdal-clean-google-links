function cleanGoogleLink(url) {
    const urlObj = new URL(url);

    if (urlObj.hostname === 'www.google.com' && urlObj.searchParams.has('url')) {
        return urlObj.searchParams.get('url');
    }

    return url;
}

function onClickHandler(info, tab) {
    const cleanUrl = cleanGoogleLink(info.linkUrl);

    if (cleanUrl) {
        navigator.clipboard.writeText(cleanUrl).then(function() {
            console.log('Copied to clipboard: ' + cleanUrl);
        }, function(err) {
            console.error('Could not copy text: ', err);
        });
    }
}

browser.contextMenus.create({
    id: "copy-clean-link",
    title: "Copy Clean Link",
    contexts: ["link"]
});

browser.contextMenus.onClicked.addListener(onClickHandler);
