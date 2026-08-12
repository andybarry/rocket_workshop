var videos = document.getElementsByTagName("video")
videoPlayAtFraction = 0.2;
function checkScroll() {

    for(var i = 0; i < videos.length; i++) {

        var video = videos[i];
        
        var frac_used = videoPlayAtFraction
        
        if (video.classList.contains("video-background") || video.classList.contains("intro-video-background")) {
            frac_used = 0.1;
        }

        if (fractionScrolledIntoView(video) > frac_used) {
            if (video.paused) {
                if (!video.classList.contains("intro-video-background")) {
                    video.currentTime = 0
                }
            }
            video.play();
        } else {
            video.pause();
        }
    }
}

function fractionScrolledIntoView(el) {
    var elemTop = el.getBoundingClientRect().top;
    var elemBottom = el.getBoundingClientRect().bottom;
    var elemHeight = elemBottom - elemTop

    if (elemTop > 0) {
        topFrac = 1
    } else {
        topFrac = (elemTop + elemHeight) / elemHeight
    }
    
    // Off the bottom of the screen
    bottomFrac = 1 + (window.innerHeight - elemBottom) / elemHeight
    bottomFrac = Math.max(0, bottomFrac)
    bottomFrac = Math.min(1, bottomFrac)
    
    
    fraction = Math.min(topFrac, bottomFrac)
    return fraction
}

window.addEventListener('scroll', checkScroll, false);
window.addEventListener('resize', checkScroll, false);

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}
 
// If the page is hidden (ie a tab change), pause all videos to save CPU
function handleVisibilityChange() {
    for(var i = 0; i < videos.length; i++) {
        var video = videos[i];
        
        if (document[hidden]) {
            video.pause()
        } else {
            video.play()
        }
    }
}

// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (typeof document.addEventListener === "undefined" || typeof document[hidden] === "undefined") {
    console.log("Auto play/pause requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.");
} else {
    // Handle page visibility change   
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
}
