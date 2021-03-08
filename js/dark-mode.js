/**
 * Vanilla Javascript DOM Ready function supporting IE 8+. This
 * allows us to call functions as soon as the DOM is actually
 * ready to be interacted with.
 *
 * @param {function} fn A function to call when the DOM is ready.
 * @see {@link http://youmightnotneedjquery.com/>}
 * @author adamfschwartz
 * @author zackbloom
 */
var domReady = function( fn ) {
    if (document.readyState != 'loading'){
        fn();
    } else if (document.addEventListener) {
        document.addEventListener( 'DOMContentLoaded', fn );
    } else {
        document.attachEvent( 'onreadystatechange', function(){
            if (document.readyState != 'loading'){
                fn();
            }
        });
    }
};

// https://stackoverflow.com/a/24103596/3193156

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function changeMode() {
    var mode = getCookie('dark-mode');
    if ( mode ) {
        var tgl = document.getElementById('dark-mode-toggle');
        if ( tgl ) {
            tgl.checked = true;
            document.body.classList.add('dark-mode');
        }
    }
}

function hookDarkModeToggle() {
    var tgl = document.getElementById('dark-mode-toggle');
    if (tgl) {
        tgl.addEventListener( 'change', toggleMode );
    } else {
        console.error('Error: We could not add a listener to the dark mode toggle button. Did you change the HTML or remove the ID?');
    }
}

function toggleMode() {
    if ( this.checked ) {
        // Turn on dark mode.
        setCookie( 'dark-mode', 'TRUE', 90 );
    } else {
        // Turn off dark mode.
        eraseCookie('dark-mode');
    }
    window.location.reload();
}

domReady( changeMode );
domReady( hookDarkModeToggle );