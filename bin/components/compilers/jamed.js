const fs   = require( 'fs' );

module.exports = function( location ) {

    let file  = fs.readFileSync( location, { encoding: 'utf8' } ) + '\n';
    let lines = file.split( '\n' );
    let html  = '';


    lines.forEach( function( line ) {

        let startTags = line.match( /\[ *\w.*?\]/g );

        if ( startTags && startTags.length > 0 ) {

            startTags.forEach( function( startTag, startIndex ) {

                let tag = startTag.match( /\[ *\w*/ )[0].replace( '[', '' ).trim();

                switch ( tag.toLowerCase() ) {
                    case 'a':
                        line = line.replace( startTag, genericElementOpen( startTag, 'a' ) );
                        break;
                    case 'br':
                        line = line.replace( endTag, genericElementOpen( startTag, 'br', true ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( startTag, genericElementOpen( startTag, 'blockquote' ) );
                        break;
                    case 'cite':
                        line = line.replace( startTag, genericElementOpen( startTag, 'cite' ) );
                        break;
                    case 'dl':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dl' ) );
                        break;
                    case 'ol':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ol' ) );
                        break;
                    case 'ul':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ul' ) );
                        break;
                    case 'dt':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dt' ) );
                        break;
                    case 'div':
                        line = line.replace( startTag, genericElementOpen( startTag, 'div' ) );
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( startTag, headerOpenElement( startTag ) );
                        break;
                    case 'hr':
                        line = line.replace( endTag, genericElementOpen( startTag, 'hr' ) );
                        break;
                    case 'li':
                        line = line.replace( startTag, genericElementOpen( startTag, 'li' ) );
                        break;
                    case 'p':
                        line = line.replace( startTag, genericElementOpen( startTag, 'p' ) );
                        break;
                    case 'video':
                        line = line.replace( startTag, videoOpenElement( startTag ) );
                        break;
                }

                line = '\n' + line.trim() + '\n';

            } );

        }

        let endTags = line.match( /\[ *\/ *\w.*?\]/g );

        if ( endTags && endTags.length > 0 ) {

            endTags.forEach( function( endTag, endIndex ) {

                let tag = endTag.match( /\[ *\/ *\w*/ )[0].replace( /\[ *?\//, '' ).trim();

                switch ( tag.toLowerCase() ) {
                    case 'a':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        break;
                    case 'br':
                        line = line.replace( endTag, genericElementOpen( endTag, 'br', true ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( endTag, genericElementClose( 'blockquote' ) );
                        break;
                    case 'cite':
                        line = line.replace( endTag, genericElementClose( 'cite' ) );
                        break;
                    case 'dl':
                        line = line.replace( endTag, genericElementClose( 'dl' ) );
                        break;
                    case 'ol':
                        line = line.replace( endTag, genericElementClose( 'ol' ) );
                        break;
                    case 'ul':
                        line = line.replace( endTag, genericElementClose( 'ul' ) );
                        break;
                    case 'dt':
                        line = line.replace( endTag, genericElementClose( 'dt' ) );
                        break;
                    case 'div':
                        line = line.replace( endTag, genericElementClose( 'div' ) );
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( endTag, headerCloseElement( endTag ) );
                        break;
                    case 'hr':
                        line = line.replace( endTag, genericElementOpen( endTag, 'hr' ) );
                        break;
                    case 'li':
                        line = line.replace( endTag, genericElementClose( 'li' ) );
                        break;
                    case 'p':
                        line = line.replace( endTag, genericElementClose( 'p' ) );
                        break;
                    case 'video':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        break;
                }

                line = '\n' + line.trim() + '\n';

            } );

        }

        html += line;

    } );

    console.log( html );

    //Opening tag: \[ *\w.*?\]
    //Closing tag: \[ *\/ *\w.*?\]

    // Send to the default compiler for variable processing and saving.
    //this.compilerDefault( location, file, false );
    return '';
}

function getAttributes( content ) {
    let attr = '';
    attr    += getId( content );
    attr    += getClasses( content );
    attr    += getDataAttributes( content );
    return attr;
}

function getClasses( content ) {
    let m = content.match( / \.(?:\w*|-*|_*)*/g );
    if ( m && m.length > 0 ) {
        return ' class="' + m.join( ' ' ).replace( '.', '' ) + '"';
    }
    return '';
}

function getDataAttributes( content ) {
    let m = content.match( /(data-.*?) *?= *?"(.*?)"/gi );
    let a = [];
    if ( m != null ) {
        m.forEach( function( data ) {
            data = data.split( '=' ); 
            a.push( ' ' + data[0].trim() + '="' + data[1].replace( /"/g, '' ).trim() + '"' );
        } );
        return a.join( ' ' );
    }
    return '';
}

function getId( content ) {
    let m = content.match( /#(?:\w*|-*|_*)*/ );
    if ( m && m.length > 0 ) {
        return ' id="' + m[0].replace( '#', '' ) + '"';
    }
    return '';
}

function getType( content ) {
    let m = content.match( /type *= *"(.*?)"/i );
    if ( m != null ){
        return m[1];
    }
    return '';
}

function getUrl( content ) {
    let m = content.match( /url *= *"(.*?)"/i );
    if ( m != null ){
        return m[1];
    }
    return '';
}

function genericElementClose( tag ) {
    return '</' + tag + '>';
}

function genericElementOpen( content, tag, skipAttributes ) {
    if ( skipAttributes ) {
        return '<' + tag + '>';
    }
    return '<' + tag + getAttributes( content ) + '>';
}

function headerCloseElement( content ) {
    let lvl = 1;
    let m   = content.match( /h\d/ );
    if ( m && m.length > 0 ) {
        lvl = m[0][1];
    }
    if ( lvl < 1 ) {
        lvl = 1;
    }
    if ( lvl > 6 ) {
        lvl = 6;
    }
    return '</h' + lvl + '>';
}

function headerOpenElement( content ) {
    let lvl = 1;
    let m   = content.match( /h\d/ );
    if ( m && m.length > 0 ) {
        lvl = m[0][1];
    }
    if ( lvl < 1 ) {
        lvl = 1;
    }
    if ( lvl > 6 ) {
        lvl = 6;
    }
    return '<h' + lvl + '>';
}

function videoOpenElement( content ) {
    let elem  = '<a href="' + getUrl( content ) + '" ';
    elem     += 'data-video="' + getType( content ) + '"';
    elem     += getAttributes( content );
    return elem + '>';
}