var videos = document.getElementsByTagName("video"),
    videoPlayAtFraction = 0.75;
    function checkScroll() {

        for(var i = 0; i < videos.length; i++) {

            var video = videos[i];
            
            if (fractionScrolledIntoView(video) > videoPlayAtFraction) {
                if (video.paused) {
                    video.currentTime = 0
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
