var APP = ( function() {

    var intervals = {
        'nav': null
    };

    var attachListeners = function() {

        document.getElementById( 'mobile-nav-button' ).addEventListener( 'click', toggleNav );

        var mores = document.querySelectorAll( 'nav .more' );
        mores.forEach( function( more ) {
            more.addEventListener( 'click', toggleMore );
        } );

    };

    /**
     * Vanilla Javascript DOM Ready function supporting IE 8+.
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

    var initialize = function() {

        attachListeners();

    };

    var toggleMore = function() {
        if ( this.classList.contains( 'open' ) ) {
            // Close open child menu.
            this.classList.remove( 'open' );
            if ( this.nextElementSibling ) {
                this.nextElementSibling.classList.remove( 'open' );
                // Also close any remaining open child menus.
                var menus = this.nextElementSibling.querySelectorAll( '.open' );
                menus.forEach( function( menu ) {
                    menu.classList.remove( 'open' );
                } );
            }
        } else {
            // Open child menu.
            this.classList.add( 'open' );
            if ( this.nextElementSibling ) {
                this.nextElementSibling.classList.add( 'open' );
            }
        }
    };

    var toggleNav = function() {
        
        var nav = document.getElementById( 'sidebar' );

        if ( ! nav.classList.contains( 'block' ) ) {

            nav.classList.add( 'block' );
            var width = nav.offsetWidth;

            if ( nav.classList.contains( 'open' ) ) {

                nav.classList.remove( 'open' );

                // Close the menu.
                intervals.nav = setInterval( function(){

                    var nav   = document.getElementById( 'sidebar' );
                    var width = nav.offsetWidth;
                    var right = parseInt( nav.style.right ) - 10;

                    if ( right < -width ) {
                        nav.style.right = '-' + width + 'px';
                        nav.classList.remove( 'block' );
                        clearInterval( intervals.nav );
                    } else {
                        nav.style.right = right + 'px';
                    }

                }, 20 );

            } else {

                nav.classList.add( 'open' );
                nav.style.right = '-' + width + 'px';

                // Open the menu.
                intervals.nav = setInterval( function(){

                    var nav   = document.getElementById( 'sidebar' );
                    var right = parseInt( nav.style.right ) + 10;

                    if ( right >= 0 ) {
                        nav.style.right = '0';
                        nav.classList.remove( 'block' );
                        clearInterval( intervals.nav );
                    } else {
                        nav.style.right = right + 'px';
                    }

                }, 20 );

            }

        }

    };

    domReady( initialize );

    return {};

} )();