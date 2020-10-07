$( document ).ready( function() {
    initialize();
} );

function initialize() {
    $( '#mobile-nav' ).click( toggleMainMenu );
    $( '.parent-item' ).click( toggleChildMenu );
}

function toggleMainMenu() {
    var menu = $('#menu');
    if ( menu.hasClass( 'open' ) ) {
        menu.toggleClass( 'open', false );
    } else {
        menu.toggleClass( 'open', true );
    }
}

function toggleChildMenu() {
    var childMenu = $( this ).next();
    if ( childMenu.hasClass( 'open' ) ) {
        childMenu.toggleClass( 'open', false );
    } else {
        childMenu.toggleClass( 'open', true );
    }
}