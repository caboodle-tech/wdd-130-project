const fs   = require( 'fs' );
const path = require('path');

module.exports = function( location, data, passBack ) {

    // Determine if we need to load the file or if we were sent the data already.
    let file = '';

    if ( data != undefined ) {
        if ( data.length > 2 ) {
            file = data;
        }
    }

    if ( file.length < 2 ) {
        file = fs.readFileSync( location, { encoding: 'utf8' } );
    }

    let lines = file.split( '\n' );
    let html  = '';

    let codeBlock   = false;
    let codeCounter = 0;

    lines.forEach( function( line ) {

        if ( line.length < 1 ) {
            return;
        }
        
        let startTags = line.match( /\[ *\w.*?\]/g );

        if ( startTags && startTags.length > 0 ) {

            startTags.forEach( function( startTag, startIndex ) {

                let tag = startTag.match( /\[ *\w*/ )[0].replace( '[', '' ).trim();

                switch ( tag.toLowerCase() ) {
                    case 'a':
                        line = line.replace( startTag, genericElementOpen( startTag, 'a' ) );
                        break;
                    case 'br':
                        line = line.replace( startTag, genericElementOpen( startTag, 'br' ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( startTag, genericElementOpen( startTag, 'blockquote' ) );
                        break;
                    case 'cite':
                        line = line.replace( startTag, genericElementOpen( startTag, 'cite' ) );
                        break;
                    case 'code':
                        if ( getType( startTag ).toLowerCase().trim() == 'block' ){
                            codeBlock = true;
                        }
                        line = line.replace( startTag, codeOpenElement( startTag, codeBlock ) );
                        break;
                    case 'div':
                        line = line.replace( startTag, genericElementOpen( startTag, 'div' ) );
                        break;
                    case 'dl':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dl' ) );
                        break;
                    case 'dt':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dt' ) );
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
                        line = line.replace( startTag, genericElementOpen( startTag, 'hr' ) );
                        break;
                    case 'key':
                        line = line.replace( startTag, genericElementOpen( startTag ), 'kdb' );
                        break;
                    case 'li':
                        line = line.replace( startTag, genericElementOpen( startTag, 'li' ) );
                        break;
                    case 'ol':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ol' ) );
                        break;
                    case 'p':
                        line = line.replace( startTag, genericElementOpen( startTag, 'p' ) );
                        break;
                    case 'ul':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ul' ) );
                        break;
                    case 'video':
                        line = line.replace( startTag, videoOpenElement( startTag ) );
                        break;
                }

               
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
                        line = line.replace( endTag, genericElementOpen( endTag, 'br' ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( endTag, genericElementClose( 'blockquote' ) );
                        break;
                    case 'cite':
                        line = line.replace( endTag, genericElementClose( 'cite' ) );
                        break;
                    case 'code':
                        line = line.replace( endTag, codeCloseElement( codeBlock ) );
                        codeBlock = false;
                        break;
                    case 'div':
                        line = line.replace( endTag, genericElementClose( 'div' ) );
                        break;
                    case 'dl':
                        line = line.replace( endTag, genericElementClose( 'dl' ) );
                        break;
                    case 'dt':
                        line = line.replace( endTag, genericElementClose( 'dt' ) );
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
                    case 'key':
                        line = line.replace( endTag, genericElementClose( 'key' ) );
                        break;
                    case 'li':
                        line = line.replace( endTag, genericElementClose( 'li' ) );
                        break;
                    case 'ol':
                        line = line.replace( endTag, genericElementClose( 'ol' ) );
                        break;
                    case 'p':
                        line = line.replace( endTag, genericElementClose( 'p' ) );
                        break;
                    case 'ul':
                        line = line.replace( endTag, genericElementClose( 'ul' ) );
                        break;
                    case 'video':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        break;
                }

            } );

        }

        if( codeBlock ) {

            if ( codeCounter > 0 ) {
                line  = line.replace( /</g, '&lt;' );
                line  = line.replace( />/g, '&gt;' );
                line += '\n';
            } else {
                line = '\n' + line;
            }

            codeCounter++;

        } else {

            codeCounter = 0;

            if ( line.length > 0 ) {
                line = '\n' + line;
            }

        }

        if ( line.length > 0 ) {
            html += line;
        }

    } );

    html = html.replace( /^\s*[\r\n]/gm, '' );

    // Process any variables.
    html = this.compilerDefault( location, html, true );

    /**
     * If a custom compiler called our built in one they may need
     * the result back instead of us immediately saving it.
     */
    if ( passBack ) {
        return html;
    } else {

        // Determine what the output file type should be.
        let ext  = path.parse( location ).ext;
        let name = path.parse( location ).name;
        let out  = this.compilers.outputs[ ext.replace( '.', '' ) ];
        if ( ! out ) {
            // Default to HTML.
            out = 'html';
        }
        out = '.' + out;

        // Build the path to the destination.
        let dest = location.replace( name + ext, name + out );
        dest     = path.join( 'release', dest );

        this.saveCompiledFile( html, dest );
    }
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

function getLanguage( content ) {
    let m = content.match( /lang *= *"(.*?)"/i );
    if ( m != null ){
        return ' class="lang-' + m[1].toLowerCase() + '"';
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


function codeCloseElement( flag ) {
    if ( flag ) {
        return '</code>\n</pre>';
    }
    return '</code>';
}

function codeOpenElement( content, flag ) {
    let elem = '';
    let lang = getLanguage( content );
    if( flag ) {
        elem += '<pre' + lang + '>\n';
    }
    elem += '<code' + lang + '>';
    return elem;
}

function genericElementClose( tag ) {
    return '</' + tag + '>';
}

function genericElementOpen( content, tag ) {
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