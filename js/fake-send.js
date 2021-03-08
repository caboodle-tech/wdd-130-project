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

/**
 * Try to find the contact form, make sure all the expected parts
 * are present, and then add a listener to the submit button.
 */
function hookContactForm() {
    // Look for form and for the message sent div.
    var form = document.getElementById('contact-form');
    var msg  = document.getElementById('contact-form-message');
    // Where they found?
    if ( form && msg ) {
        // Yes. Now look for the submit button.
        var btn = document.getElementById('contact-form-submit');
        if ( btn ) {
            // Found it! Everything is good add the listener.
            btn.addEventListener( 'click', fakeSend );
        } else {
            // Not found, show error.
            console.error('Error: Your contact form must use a button or input submit type with the provided ID.')
        }
    } else {
        // Not found, show error.
        console.error('Error: You should only include the fake-send.js file on your contact page and the contact form must use the provided ID and include the message div with the provided ID.')
    }
}

/**
 * Capture the submit event on the form and stop it. This will
 * show a message and disable the button for 7 seconds to
 * pretend it sent the message.
 */
function fakeSend() {
    // Stop normal button operation.
    event.preventDefault();
    // Grab the button from the page and check if it is disabled.
    var btn = document.getElementById('contact-form-submit');
    if (  btn.disabled != true ) {
        // Button active, disable it and show our fake send message.
        btn.disabled = true;
        var msg  = document.getElementById('contact-form-message');
        msg.classList.add('show');
        msg.innerHTML = 'Your message was sent successfully! We\'ll be in touch soon.';
        // Start a timer to enable the button and erase the message in 7 seconds.
        setTimeout( function() {
            btn.disabled = false;
            msg.classList.remove('show');
            msg.innerHTML = '';
        }, 7000 );
    }
}

// Call the hookContactForm() function as soon as the DOM is ready.
domReady( hookContactForm );