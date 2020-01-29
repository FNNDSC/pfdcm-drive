/////////
///////////////////////////
///////// Object prototypes 
///////////////////////////
/////////

/////////
///////// Debug object
/////////
/*
    This object provides a simple tool for simple debugging --
    mostly entering and exiting functions, printing some 
    state, etc.
*/

function Debug(d) {
    /*
    Print some debugging info to console.

    d.functionName      string      name of function
    d.message           string      message
    d.var               var         variable to print

    */

    this.functionName   = '<void>';
    this.message        = '<void>';
    this.var            = null;
    this.tab            = 0;

    if (d.constructor == Object) {
        prototype.argcheck(d)
    }

    if(typeof(d) === 'string' || d instanceof String) {
        this.functionName   = d
    }

}

Debug.prototype = {

    constructor:    Debug,

    argcheck:       function (d) {
        if (typeof (d.functionName) != 'undefined')
            this.functionName = d.functionName;
        if (typeof (d.message) != 'undefined')
            this.message = d.message;
        if (typeof (d.var) != 'undefined')
            this.var = d.var;
    },

    cl:             function () {
        console.log(' ');
    },

    indent:         function () {
        str_indent = '';
        for (i = 0; i < this.tab; i++)
            str_indent = str_indent + '\t';
        return str_indent;
    },

    entering:       function () {
        functionCallDepth += 1;
        this.tab = functionCallDepth;
        console.log(
            this.indent()           + 
            '--------> Entering '   + 
            this.functionName       + 
            '...');
    },

    leaving:        function () {
        console.log(
            this.indent()       + 
            'Leaving '          + 
            this.functionName   + 
            ' --------> ');
        functionCallDepth -= 1;
    },

    vlog:           function (d) {
        this.argcheck(d);
        if (typeof (this.var) === 'object') {
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message + ' = '
            );
            console.log(d.var);
        } else
            console.log(
                this.indent()               + 
                'In ' + this.functionName   + 
                ': ' + d.message    + ' = ' + d.var);
    },

    log:            function (d) {
        this.argcheck(d);
        console.log(
                this.indent()               + 
                'In ' + this.functionName + ': ' + d.message);
    }

}


/////////
///////// DOM object
/////////
/*
    This object provides a convenient abstraction
    for accessing named components of the DOM, removing
    the very tight coupling that might occur by referening
    DOM literals.
*/

function DOM(al_keylist) {
    this.l_DOM = al_keylist;
}

DOM.prototype = {
    constructor:    DOM,

    elements:   function() {
        return this.l_DOM;
    },

    get:    function(str_key) {
        if(this.l_DOM.includes(str_key)) {
            return $('#'+str_key).val()
        } else {
            return null;
        }
    },

    set:    function(str_key, str_val) {
        if(this.l_DOM.includes(str_key)) {
            $('#'+str_key).val(str_val)
            return $('#'+str_key).val();
        } else {
            return null;
        }
    }
}

/////////
///////// URL object
/////////
/*
    This object parses the URL for parameters to set in the 
    dashboard.
*/

function URL(dom) {
    this.dom        = dom;
    this.str_query  = window.location.search;
    this.urlParams  =  new URLSearchParams(this.str_query);
}

URL.prototype = {
    constructor:    URL,

    parse:          function() {
        this.dom.elements().forEach(el => {
            if(this.urlParams.has(el)) {
                this.dom.set(el, this.urlParams.get(el));
            }
        })
    }
}

/////////
///////// MSG object
/////////
/*
    This object generates messages to send to the remote 
    `pfdcm` server
*/

function MSG(d_comms) {
    // parameters governing the message comms in general
    this.d_comms            = d_comms;

    // this.str_VERB           = d_comms['VERB'];
    // this.scheme             = d_comms['scheme'];
    // this.str_path           = d_comms['path'];
    // this.type               = d_comms['type'];

    // info on this *specific* message
    this.payload            = '';
    this.str_schemeAuthPath = '';
}

MSG.prototype = {
    constructor:    MSG,

    APIschemeAuthPath_build:    function() {
        /*
        Return the first part of the API call, typically the
        http://<host>[:<IP>][/path]
        */
        return(this.d_comms['scheme']       + 
               '://'                        +
               DOMurl.get('pfdcm_IP')       +
               ':'                          +
               DOMurl.get('pfdcm_port')     +
               this.d_comms['path']);
    },

    hello:                      function() {
        /*
        Return the JSON payload for a 'hello' message.
        */

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        d_meta  = {
            "askAbout": "sysinfo",
            "echoBack": "greetings"
        };
        d_msg = {
            "action": "hello",
            "meta": {
                "askAbout": "sysinfo",
                "echoBack": "greetings"
            }
        };   
        return(d_msg);    
    }
}

/////////
///////// PFResponse object
/////////

function PFResponse(str_response) {
    this.help = `
        The PFResponse processes the rather idiosyncratic return
        from PF-family services
    `;
    this.str_response   = str_response;
}

PFResponse.prototype = {
    constructor:    PFResponse,
}

/////////
///////// AJAX abstraction object
/////////

function AJAX(Msg) {
    this.help = `
        The AJAX object specifies communication basics using
        the jQuery $.ajax(...) mechanism. 

        The design pattern normalizes usage between the two
        backend infrastructure engines, the AJAX and Fetch.
    `;
    this.SRVresp        = null;
    this.json_SRVresp   = null;
    this.TX             = Msg;
}

AJAX.prototype = {
    constructor:    AJAX,

    onError_callBack:       function (xhdr, textStatus, thrownError) {
        hdr = null;
        console.log('Some error was triggered.');
        console.log('textStatus         = ' + textStatus);
        console.log('xhdr.statusText    = ' + xhdr.statusText);
        console.log('xhdr.responseText  = ' + xhdr.responseText);
        console.log('xhdr.status        = ' + xhdr.status);
        console.log('thrownError        = ' + thrownError);
        var str = JSON.stringify(xhdr.responseText, null, 2);
        output(syntaxHighlight(xhdr.status));
        hdr = xhdr;
    },

    onBefore_callBack:      function () {
        var debug = new Debug("AJAX.onBefore_callback");
        debug.entering();
        debug.leaving();
    },

    onComplete_callBack:    function (jqXHR, textStatus) {
        var debug = new Debug("AJAX.onComplete_callBack");
        debug.entering();
        debug.leaving();
    },

    onSuccess_callBack:     function (SRVresp, textStatus, jqXHR) {
        /*
            This is an asynchronous function, so when a button in UI
            is hit triggering a REST call, internal state is not 
            updated until this function is called.
        */

        var debug = new Debug("AJAX.onSuccess_callback");
        debug.entering();

        debug.vlog({ 'message': 'SRVresp', var: SRVresp });

        debug.leaving();
    },

    transmitAndProcess: function (payload) {
        $.ajax({
            type:           this.TX.d_comms['VERB'],
            url:            this.TX.str_schemeAuthPath,
            crossDomain:    true,
            dataType:       this.TX.d_comms['type'],
            data:           payload,
            async:          false,
            beforeSend:     this.onBefore_callBack,
            complete:       this.onComplete_callBack,
            success:        this.onSuccess_callBack,
            error:          this.onError_callBack   
        })
    },
}

function Fetch(Msg) {
    this.help = `
        The Fetch object specifies communication basics using
        the fetch(...) mechanism. 

        The passed Msg object contains the payload and comms
        parameters for transmission (hence TX), while returned
        data is captured in the Fetch object itself.
    `;
    this.SRVresp        = null;
    this.json_SRVresp   = null;
    this.TX             = Msg;
    this.TXoptions      = {};
    this.fetchRetries   = 5;
    this.payload        = '';
    this.reponse        = null;
}

Fetch.prototype = {
    constructor: Fetch,

    postData: async function (url = '', data = {}) {
        /*
        Note that "weird" behaviour in comms is most often
        linked to parameter settings below. For example, sending
        any 'headers' seems to trigger an OPTIONS verb in the
        server irrespective of the 'method' value.
        */
        var debug = new Debug("Fetch.postData");
        debug.entering();

        this.response  = await fetch(url, this.TXoptions);
        debug.leaving();
        return this.response.text();
    },

    checkFirstForErrorsInResponse:  function (response) {
        var debug = new Debug("Fetch.checkFirstForErrorsInResponse");
        debug.entering();

        debug.vlog({ 'message': '\nresponse', var: response });

        // Some parsing on 'reponse' for an error condition,
        // possibly reponse.ok if a Response object is passed
        if (!response.ok) {
            throw Error(response.statusText);
        }

        debug.leaving();
        return response;
    },

    handleReponse:  function (response) {
        var debug = new Debug("Fetch.handleResponse");
        debug.entering();

        console.log(response);
        
        debug.leaving();

        return response;

    },

    handleErrorsInFetch:  async function (response) {
        var debug = new Debug("Fetch.handleErrorsInFetch");
        debug.entering();
        debug.vlog({ 'message': '\nresponse', var: response });

        console.log('attempting to call again!');

        this.response   = await this.fetch_retry(
                                this.TX.str_schemeAuthPath, 
                                this.TXoptions, 
                                this.fetchRetries
                        );

        debug.leaving();
        return await response.text();
    },

    fetch_retry:    async (url, options, n) => {
        var debug = new Debug("Fetch.fetch_retry");
        debug.entering();

        let error;
        for(let i=0; i<n; i++) {
            try {
                return await fetch(url, options);
            } catch(err) {
                error =err;                
            }
        }
        debug.leaving();
        throw error;
    },

    transmitAndProcess: async function (payload) {
        this.payload    = payload;
        this.TXoptions  = {
            method:         this.TX.d_comms['VERB'],    // *GET, POST, PUT, DELETE, etc.
            mode:           'cors',                     // no-cors, *cors, same-origin
            cache:          'no-cache',                 // *default, no-cache, reload, force-cache, only-if-cached
            credentials:    'same-origin',              // include, *same-origin, omit
            headers: {      'Content-Type': 'text/plain'},
            redirect:       'follow',                   // manual, *follow, error
            referrerPolicy: 'no-referrer',              // no-referrer, *client

            // body data type must match "Content-Type" header
            body: JSON.stringify(payload)
        };

        try {
            str_response  = await this.postData(this.TX.str_schemeAuthPath, payload);
        } catch(e) {
            this.handleErrorsInFetch(e);
        } finally {
            this.handleReponse(str_response);
        }

    },

}

/////////
///////// REST calling object
/////////

function REST(d_comms) {
    this.help = `
        The REST object handles communication with a server
        process.

        One of two core backends are available, specified
        by the 'commsBackend' passed in the <d_comms>
        dictionary:

            'fetch':        Uses the new fetch() API, which
                            is cleaner and preserves nested
                            JSON dictionaries transmitted
                            to server. This is the preferred
                            method.

            'ajax':         Uses the jQuery $.ajax() infrastructure
                            and provided more for historical
                            purposes. Note this method
                            flattens transmitted JSON
                            dictionaries.
    `;
    // The msg contains all data necessary for comms:
    //      remote address, payload, header info etc.
    this.msg                = new MSG(d_comms);
    this.SRVresp            = null;     // Raw reponse
    this.json_SRVresp       = null;     // JSONified response

    switch(d_comms['clientAPI']) {
        case 'Fetch':   
            this.clientAPI  = new Fetch(this.msg);
            break;
        case 'Ajax':
            this.clientAPI  = new AJAX(this.msg)
            break;
    }
}

REST.prototype = {
    constructor:    REST,

    hello:                  function() {
        /*
        Say hello to pfdcm
        */
        this.transmitAndProcess(this.msg.hello());
    },

    do:                     function(d_op) {
        if('operation' in d_op) {
            switch(d_op['operation']) {
                case 'hello':   this.hello();
            }
        }
    },

    transmitAndProcess: function(payload) {
        this.clientAPI.transmitAndProcess(payload);
    },

}

// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------
// Some "global" variables.

l_urlParams = [   
    "pfdcm_IP", 
    "pfdcm_port", 
    "PACS_IP", 
    "PACS_port", 
    "PACS_AET", 
    "PACS_AEC", 
    "PACS_AETL",
    "PACS_name"
];

DOMurl      = new DOM(l_urlParams);
url         = new URL(DOMurl);
post        = new REST( {
                            'VERB':         'POST',
                            'type':         'text',
                            'scheme':       'http',
                            'path':         '/api/v1/cmd/',
                            'clientAPI':    'Fetch'
                        })


// The whole document
$body                       = $("body");

// Some specific parts of the document -- in a proper design these would be members
// of a class. To indicate the more global scope, these are all prepended with an 'm'
// for 'member'. ** Not implemented yet **
// result_DOM                  = document.getElementById("result");
// PUSH_DOM                    = document.getElementById("dom_PUSH");
// URLsFromChRIS_DOM           = $('#URLsFromChRIS');
// d_URLsFromChRIS             = null;
// key_DOM                     = $('#key');
// // API call return strings
// APIcall                     = '';
// json_SRVresp              = '';
// // Some default/persistent URL select options.
// str_pathUp                  = '';
// str_allFeedsBase            = '';
// str_loginFile               = '';
// b_URLsBuild                 = true;
b_jsonSyntaxHighlight       = true;
b_useFileDB_status          = true;
b_createNewDB_status        = false;
b_loginStatus               = false;
b_canPUSH                   = false;            // Toggles PUSH display
b_PUSHchoicesRendered       = false;
functionCallDepth           = 0;
// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------


$(document).on({
    ajaxStart:  function() { $body.addClass("loading");  output(APIcall);  },
    ajaxStop:   function() { $body.removeClass("loading"); }
});

$( "#helpInfo" ).dialog({
    autoOpen:       false,
    height:         520,
    width:          500,
    dialogClass:    'helpInfo-dialog'
});

$( "#opener" ).click(function() {
    $( "#helpInfo" ).dialog( "open" );
});

$(".onlythree").keyup(function () {    
    if (this.value.length == this.maxLength) {    
        $(this).next('.onlythree').focus();    
    }    
});

function jsonSyntaxHightlight_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "jsonSyntaxHighlight_toggle";
    debug.entering();
    JSON_syntaxButton_DOM = document.getElementById("JSON_status");
    debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
    b_jsonSyntaxHighlight = !b_jsonSyntaxHighlight;
    debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', var: b_jsonSyntaxHighlight});
    if(b_jsonSyntaxHighlight) {
        JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
        JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-on';
    }
    if(!b_jsonSyntaxHighlight) {
        JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
        JSON_syntaxButton_DOM.className     = 'button-xsmall pure-button pure-button-primary button-jsonHighlight-off';
    }
    debug.leaving();
}

function useFileDB_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "useFileDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("useFileDB_status");
    debug.vlog({message: 'before toggle: b_useFileDB_status', var: b_useFileDB_status});
    b_useFileDB_status = !b_useFileDB_status;
    debug.vlog({message: 'after  toggle: b_useFileDB_status', var: b_useFileDB_status});
    if(b_useFileDB_status) {
        fileDB_status_DOM.innerHTML     = 'Use file DB: ON';
        fileDB_status_DOM.className     = 'button-xsmall pure-button pure-button-primary button-useFileDB-on';
    }
    if(!b_useFileDB_status) {
        fileDB_status_DOM.innerHTML     = 'Use file DB: OFF';
        fileDB_status_DOM.className     = 'button-xsmall pure-button pure-button-primary button-useFileDB-off';
    }
    debug.leaving();
}

function createNewDB_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "createNewDB_toggle";
    debug.entering();
    fileDB_status_DOM = document.getElementById("createNewDB_status");
    fileDB_label_DOM  = document.getElementById("createNewDB_feedsLabel");
    fileDB_feeds_DOM  = document.getElementById("createNewDB_feedsVal");
    debug.vlog({message: 'before toggle: b_createNewDB_status', var: b_createNewDB_status});
    b_createNewDB_status = !b_createNewDB_status;
    debug.vlog({message: 'after  toggle: b_createNewDB_status', var: b_createNewDB_status});
    if(b_createNewDB_status) {
        fileDB_status_DOM.innerHTML         = 'Create new DB: ON';
        fileDB_status_DOM.className         = 'button-xsmall pure-button pure-button-primary button-createNewDB-on';
        fileDB_label_DOM.style.visibility   = 'visible';
        fileDB_feeds_DOM.style.visibility   = 'visible';
    }
    if(!b_createNewDB_status) {
        fileDB_status_DOM.innerHTML         = 'Create new DB: OFF';
        fileDB_status_DOM.className         = 'button-xsmall pure-button pure-button-primary button-createNewDB-off';
        fileDB_label_DOM.style.visibility   = 'hidden';
        fileDB_feeds_DOM.style.visibility   = 'hidden';
    }
}

function loginStatus_toggle() {
    var debug           = new C_debug();
    debug.functionName  = "loginStatus_toggle";
    debug.entering();
    b_loginStatus   = !b_loginStatus;
    debug.vlog({message: 'b_loginStatus', var: b_loginStatus});
    if(b_loginStatus) {
        login();
    } else {
        logout();
    }
    debug.leaving();
}

function file_exist(str_filename) {
    var http = new XMLHttpRequest();
    http.open('HEAD', str_filename, false);
    http.send();
    return http.status!=404;
}

function loginStatus_show(ab_status) {
    var debug           = new C_debug();
    debug.functionName  = "loginStatus_show";
    debug.entering();
    loginStatus_DOM = document.getElementById("loginStatus");
    debug.vlog({message: 'ab_status', var: ab_status});
    b_loginStatus = ab_status;
    if(ab_status) {
        loginStatus_DOM.innerHTML           = 'login status: logged in';
        loginStatus_DOM.className           = 'button-xsmall button-loginStatus-loggedIn pure-button';
    } else {
        loginStatus_DOM.innerHTML           = 'login status: logged out';
        loginStatus_DOM.className           = 'button-xsmall button-loginStatus-loggedOut pure-button';
    }
    debug.leaving();
}

function loginStatus_fileTagGenerate() {
    serverAddress       = window.location.href;
    l_p = serverAddress.split('/');
    str_loginFile       = 'chris-login.json';
    l_p[l_p.length - 1] = str_loginFile;
    str_loginURLtag     = l_p.join('/');
}

function login() {
    d_APIcall = {
        'type':             'GET',
        'APIcallOverride':  '/v1/login?auth=user=chris,passwd=chris1234',
        'showOutput':       true,
        'data':             ''
    };
    REST_call(d_APIcall);
    loginStatus_show(file_exist(str_loginURLtag));
    b_URLsBuild = false;
}

function logout() {
    d_APIcall = {
        'type':             'GET',
        'APIcallOverride':  '/v1/logout?auth=user=chris,auth=ABCDEF',
        'showOutput':       true,
        'data':             ''
    };
    REST_call(d_APIcall);
    loginStatus_show(file_exist(str_loginURLtag));
    b_URLsBuild = false;
}



window.onload = function() {
    // loginStatus_fileTagGenerate();
    // loginStatus_show(file_exist(str_loginURLtag));

    // Parse the URL and populate relevant elements on the page
    url.parse();
};

