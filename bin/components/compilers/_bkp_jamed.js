const fs   = require( 'fs' );

module.exports = function( location ) {

    let file  = fs.readFileSync( location, { encoding: 'utf8' } ) + '\n';
    let lines = file.split( '\n' );
    //console.log( lines );
    //return;
    let html  = '';

    let codeBlock = false;
    let blockNewline = false;
    let tagOpen   = 0;

    lines.forEach( function( line ) {

        if ( line.length < 1 ) {
            return;
        }

        // Record the space
        let spaces = line.length - line.trimStart().length;
        if ( spaces > 0 ) {
            
            spaces = ( '_' ).repeat( spaces );
            
        } else {
            spaces = '';
        }

        
        let noTags    = true;
        let skipNewline = false;
        let startTags = line.match( /\[ *\w.*?\]/g );

        if ( startTags && startTags.length > 0 ) {

            noTags   = false;
            tagOpen += 1;

            startTags.forEach( function( startTag, startIndex ) {

                let tag = startTag.match( /\[ *\w*/ )[0].replace( '[', '' ).trim();

                switch ( tag.toLowerCase() ) {
                    case 'a':
                        line = line.replace( startTag, genericElementOpen( startTag, 'a' ) );
                        blockNewline = true;
                        break;
                    case 'br':
                        line = line.replace( startTag, genericElementOpen( startTag, 'br' ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( startTag, genericElementOpen( startTag, 'blockquote', true ) );
                        skipNewline = true;
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
                        line = line.replace( startTag, genericElementOpen( startTag, 'div', true ) );
                        skipNewline = true;
                        break;
                    case 'dl':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dl', true ) );
                        skipNewline = true;
                        break;
                    case 'dt':
                        line = line.replace( startTag, genericElementOpen( startTag, 'dt', true ) );
                        skipNewline = true;
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( startTag, headerOpenElement( startTag ) );
                        blockNewline = true;
                        break;
                    case 'hr':
                        line = line.replace( startTag, genericElementOpen( startTag, 'hr' ) );
                        break;
                    case 'key':
                        line = line.replace( startTag, genericElementOpen( startTag ), 'kdb' );
                        blockNewline = true;
                        break;
                    case 'li':
                        line = line.replace( startTag, genericElementOpen( startTag, 'li', true, line ) );
                        skipNewline = true;
                        break;
                    case 'ol':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ol', true ) );
                        skipNewline = true;
                        break;
                    case 'p':
                        line = line.replace( startTag, genericElementOpen( startTag, 'p', true ) );
                        skipNewline = true;
                        break;
                    case 'ul':
                        line = line.replace( startTag, genericElementOpen( startTag, 'ul', true ) );
                        skipNewline = true;
                        break;
                    case 'video':
                        line = line.replace( startTag, videoOpenElement( startTag ) );
                        blockNewline = true;
                        break;
                }

               
            } );

        }

        let endTags = line.match( /\[ *\/ *\w.*?\]/g );

        if ( endTags && endTags.length > 0 ) {

            noTags  = false;
            tagOpen -= 1;

            endTags.forEach( function( endTag, endIndex ) {

                let tag = endTag.match( /\[ *\/ *\w*/ )[0].replace( /\[ *?\//, '' ).trim();

                switch ( tag.toLowerCase() ) {
                    case 'a':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        blockNewline = false;
                        break;
                    case 'br':
                        line = line.replace( endTag, genericElementOpen( endTag, 'br' ) );
                        break;
                    case 'blockquote':
                    case 'quote':
                        line = line.replace( endTag, genericElementClose( 'blockquote', true  ) );
                        break;
                    case 'cite':
                        line = line.replace( endTag, genericElementClose( 'cite' ) );
                        break;
                    case 'code':
                        line = line.replace( endTag, codeCloseElement( codeBlock ) );
                        codeBlock = false;
                        break;
                    case 'div':
                        line = line.replace( endTag, genericElementClose( 'div', true ) );
                        break;
                    case 'dl':
                        line = line.replace( endTag, genericElementClose( 'dl', true ) );
                        break;
                    case 'dt':
                        line = line.replace( endTag, genericElementClose( 'dt', true ) );
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                    case 'h4':
                    case 'h5':
                    case 'h6':
                        line = line.replace( endTag, headerCloseElement( endTag ) );
                        blockNewline = false;
                        break;
                    case 'hr':
                        line = line.replace( endTag, genericElementOpen( endTag, 'hr' ) );
                        break;
                    case 'key':
                        line = line.replace( endTag, genericElementClose( 'key' ) );
                        blockNewline = false;
                        break;
                    case 'li':
                        line = line.replace( endTag, genericElementClose( 'li', true ) );
                        break;
                    case 'ol':
                        line = line.replace( endTag, genericElementClose( 'ol', true ) );
                        break;
                    case 'p':
                        line = line.replace( endTag, genericElementClose( 'p', true ) );
                        break;
                    case 'ul':
                        line = line.replace( endTag, genericElementClose( 'ul', true ) );
                        break;
                    case 'video':
                        line = line.replace( endTag, genericElementClose( 'a' ) );
                        blockNewline = false;
                        break;
                }


               
                

            } );

        }

       //line = line.replace( /^\s*[\r\n]/gm, '' );


        if ( noTags && line.length > 0 ) {

            line = '>>> ' + line;
            //line = line.replace( /\n/g, '___' );
            //console.log( line );
            
        }

        if( codeBlock && noTags ) {
            //line = '+++ ' + line + '\n';
        }

        if ( line.length > 0 ) {
            console.log( '[' + spaces + ']' );
            html += '\n' + spaces + line;
            if ( noTags && ! blockNewline ) {
               // html += '\n';
            }
        }

    } );

    html = html.replace( /^\s*[\r\n]/gm, '' );

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

function genericElementClose( tag, newline ) {
    let html = '</' + tag + '>';
    if ( newline ) {
        //html = '\n' + html;
    }
    return html;
}

function genericElementOpen( content, tag, newline ) {
    let html = '<' + tag + getAttributes( content ) + '>';
    if ( newline ) {
        //html = '\n' + html;
    }
    return  html;
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