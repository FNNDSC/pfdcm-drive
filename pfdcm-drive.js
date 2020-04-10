/////////
///////////////////////////
///////// Object prototypes 
///////////////////////////
/////////

/////////
///////// Debug object
/////////
/*
    This object provides a straightforward interface for simple debugging --
    mostly entering and exiting functions, printing some state, etc.
*/

function Debug(d) {
    /*
    Print some debugging info to console.

    d.functionName      string      name of function
    d.message           string      message
    d.var               variable    variable to print

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

function DOM(al_keylist) {
    this.str_help = `

        This object provides a convenient abstraction
        for accessing and interacting with named components 
        of the DOM, removing the very tight coupling that 
        might occur by referening DOM literals directly in JS.
    
    `;
    this.l_DOM = al_keylist;
}

DOM.prototype = {
    constructor:    DOM,

    elements:           function() {
        return this.l_DOM;
    },

    get:                function(str_key) {
        if(this.l_DOM.includes(str_key)) {
            return $('#'+str_key).val()
        } else {
            return null;
        }
    },

    html:               function(str_key, str_val) {
        if(this.l_DOM.includes(str_key)) {
            $('#'+str_key).html(str_val)
        }
    },

    innerHTML_listadd:  function(str_key, l_val) {
        if(this.l_DOM.includes(str_key)) {
            for(const str_line of l_val) {
                document.getElementById(str_key).innerHTML += str_line;
            }
        }
    },

    innerHTML_listset:  function(str_key, l_val) {
        if(this.l_DOM.includes(str_key)) {
            document.getElementById(str_key).innerHTML = '';
            for(const str_line of l_val) {
                document.getElementById(str_key).innerHTML += str_line;
            }
        }
    },

    style_set:          function(str_key, d_style) {
        if(this.l_DOM.includes(str_key)) {
            for(const [key, value] of Object.entries(d_style)) {
                document.getElementById(str_key).style[key] = value;
            }
        }
    },

    type_set:           function(str_key, typeSet) {
        if(this.l_DOM.includes(str_key)) {
            document.getElementById(str_key).type = typeSet;
        }
    },

    set:                function(str_key, str_val) {
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

function URL(dom) {
    this.str_help   = `

        This object parses the URL for parameters to set in the 
        dashboard.

    `;
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
///////// PACSRetrieve
/////////

function PACSRetrieve() {
    this.str_help   = `

        The PACSRetrieve object handles aspects relating to "retrieving" image
        data from a PACS.

        The core of this object is a (dynamic) list/array dictionary -- each
        field of which denotes a single series to request from the PACS.

        This object handles the creation of the request message and also the
        logic of returning status results on requests.

    `;
    this.set_series         = new Set();        // set of all the series in object

    // actual dictionary of lists for retrieve and status    
    this.map_retrieve       = new Map();        
    this.map_retrieve.set('l_retrieve',     []);    
    this.map_retrieve.set('l_displayInfo',  [])
    this.map_retrieve.set('l_status',       []);
    this.d_retrieve         = {}
}

PACSRetrieve.prototype = {
    constructor:    URL,

    // PACSRetrieve.prototype
    series_isInQueue:   function(str_seriesUID) {

        let str_help    = `

            Return a boolean denoting if a passed str_seriesUID is
            already in the 'l_retrieve' list of dictionaries.

        `;

        return(this.set_series.has(str_seriesUID));

    },

    // PACSRetrieve.prototype
    retrieve_push:      function(ol_dataRetrieve, ol_dataInfo) {
        /*
            ol_data:    list of objects to process

            "push" a new retrieve spec into the d_retrieve map, check that
            series is not already in this session, and return, for the 
            passed ol_dataRetrieve, a list of retrieves to call.
        */

        let     ld_dataRetrieve = [];
        let     ld_dataInfo     = [];
        let     d_ret           = {
                                    'status':           false,
                                    'ld_retrieveSpec':   {},
                                    'ld_info':           {}
                                };

        let     zip             = (a,b) => a.map((x,i) => [x, b[i]]);

        for(const [o_dataRetrieve, o_infoRetrieve] of zip(ol_dataRetrieve, ol_dataInfo)) {
            let d_dataRetrieve  = Object.fromEntries(o_dataRetrieve);
            let d_dataInfo      = Object.fromEntries(o_infoRetrieve);
            if(!this.series_isInQueue(d_dataRetrieve.SeriesInstanceUID)) {
                this.set_series.add(d_dataRetrieve.SeriesInstanceUID);
                ld_dataRetrieve.push(d_dataRetrieve);
                ld_dataInfo.push(d_dataInfo);
            }
        }           

        if(ld_dataRetrieve.length) {
            this.map_retrieve.set(  'l_retrieve',
                                    this.map_retrieve.get('l_retrieve').concat(ld_dataRetrieve)
                                );
            this.map_retrieve.set(  'l_displayInfo',
                                    this.map_retrieve.get('l_displayInfo').concat(ld_dataInfo)
                                );
            d_ret.status            = true;
            d_ret.ld_retrieveSpec   = ld_dataRetrieve;
            d_ret.ld_info           = ld_dataInfo;
        }
        return(d_ret);
    }
}

/////////
///////// PFResponse object
/////////

function PFResponse(response) {
    this.help = `

        The PFResponse processes the rather idiosyncratic return
        from PF-family services.
    
    `;
 
    this.response           = response;

    // The raw string response can be "funky"
    this.str_responseRaw    = '';
    this.json_response      = {};

    this.l_headerResponse   = [];
    this.l_bodyResponse     = [];
    this.str_bodyResponse   = '';
    this.l_response         = [];

    // This is more regular "sanitized" string response
    this.str_response       = '';

    // A PACS retrieve object to handle retrieve requests/logic
    this.pacsretrieve       = new PACSRetrieve();

    this.response_typeParse(response);

};   

PFResponse.prototype = {
    constructor:    PFResponse,

    response_typeParse: function(response) {
        switch(typeof(response)) {
            case    'undefined':
                break;
            case    'string':
                this.str_responseRaw    = response;
                break;
            case    'object':
                this.json_response      = response;
                break;
        };
    },

    set:        function(response) {
        this.response_typeParse(response);
    },

    str_get:    function() {
        return(this.str_responseRaw);
    },

    querySeries_toStudySeriesIndex: function(astr_seriesInstanceUID) {

        let str_help    = `

            Given a SeriesInstanceUID string, return the corresponding
            study and series index in a given query response object.

            Note indices are return counting from zero-order!

            return d_ret = {
                'status':   true|false,
                'study':    <int>studyIndex,
                'series':   <int>indexIndex
            }

        `;

        d_ret   = {
            'status':       false,
            'study':        -1,
            'series':       -1
        }

        if('query' in this.json_response) {
            let totalNumberOfStudies = this.json_response.query.report.rawText.length;
            for(let study = 0; study < totalNumberOfStudies; study++) {
                d_report = this.json_response.query.report.json[study];
                let series = 0;
                for(const bodySeriesUID of d_report.bodySeriesUID) {
                    if(bodySeriesUID.SeriesInstanceUID === astr_seriesInstanceUID) {
                        d_ret = {
                            'status':   true,
                            'study':    study,
                            'series':   series
                        }
                        break;
                    }
                    series++;
                }
            }
        }

        return d_ret;
    },

    response_bodyStringUpdate:      function(str_body, ab_JSONupdate) {

        let str_help    = `

            If the body string has been updated by some mechanism,
            this method reconstructs various internals to be in
            sync with the new body.

            If the optional <b_JSONupdate> is true, then the
            json dictionary is also updated.

        `;

        let b_JSONupdate    = false;
        
        switch(typeof(ab_JSONupdate)) {
            case    'undefined':
                break;
            case    'boolean':
                b_JSONupdate    = ab_JSONupdate;
                break;
        }

        this.str_bodyResponse   = str_body;
        if(ab_JSONupdate)
            this.json_response  = JSON.parse(this.str_bodyResponse);
        this.l_bodyResponse     = this.str_bodyResponse.split('\n');

        this.l_response         = this.l_headerResponse.concat(this.l_bodyResponse);
        this.str_response       = this.l_response.join('\n');
    },

    responseHTML_parseHeadBody:     function() {
        let str_help    = `

            Split the HTML string response from the remote 
            pf-family server into the header and body components
            as well as a JSON representation of the body.

        `;

        this.l_headerResponse   = this.str_responseRaw.split('\r');

        // The 4th element of the l_headerReponse contains the actual
        // stringified JSON body return payload. We need to set the body 
        // to that index element and then split on '\n' to create list of 
        // lines for the body 
        this.str_bodyResponse   = this.l_headerResponse[4];
        this.json_response      = JSON.parse(this.str_bodyResponse);
        this.l_bodyResponse     = this.str_bodyResponse.split('\n');

        // Remove the "body" from the orignal header list
        this.l_headerResponse.pop();

        this.l_response         = this.l_headerResponse.concat(this.l_bodyResponse);
        this.str_response       = this.l_response.join('\n');
    },

    parse:                          function() {
        let str_help = `

            Mostly a convenience function that calls the 
            responseHTML_parseHeadBody method.

        `;

        this.responseHTML_parseHeadBody();
    }
}

/////////
///////// MSG object
/////////

function MSG(d_comms) {
    this.help = `

        The MSG object primarily does two things:

            *   it is responsible for generating the actual message payload
                to transmit to a remote service
            *   it has a concept of where in the DOM to "write" results
            
        In this fashion, the MSG object is the proverbial contact surface 
        between idiosyncracies of the remote service ('pfdcm' and how to speak
        to it, as well as understanding its responses) and the vagrancies of
        this specific JS/web app. This object thus also needs to know what
        element on the main HTML page is associated with the results of this
        message.

        As such there is an implicit coupling between this object and the 
        syntax of the remote server as well as the named elements in the DOM.

    `;

    // parameters governing the message comms
    this.d_comms            = d_comms;

    // the page we're acting within
    this.page               = d_comms['page'];

    // info on this *specific* message: the payload to transmit and
    // the destination
    this.payload            = '';
    this.str_schemeAuthPath = '';

    // The actual response received from this message object, organized
    // into three separate bins
    this.pfresponse         = new PFResponse(); // the response
    this.queryPFresponse    = new PFResponse(); // a copy for query
    this.l_pfresponse       = [];               // an array of responses

     // A string key linking this message object to a component 
     // on the HTML page
     this.str_DOMkey        = '';

     // A dictionary object to hold some "meta" data for additional
     // fine-tuned behaviour
     this.d_meta            = {
         'modalDialog':     false
     }
}

MSG.prototype = {
    constructor:    MSG,

    APIschemeAuthPath_build:    function() {
        str_help = `

            Return the first part of the API call, typically the
            http://<host>[:<IP>][/path]

        `;

        return(this.d_comms['scheme']               +
               '://'                                +
               this.page.DOMurl.get('pfdcm_IP')     +
               ':'                                  +
               this.page.DOMurl.get('pfdcm_port')   +
               this.d_comms['path']);
    },

    // MSG.prototype
    hello:                      function() {
        str_help = `

            Return the JSON payload for a 'hello' message.

        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        let d_msg = {
            "action": "hello",
            "meta": {
                "askAbout": "sysinfo",
                "echoBack": "greetings"
            }
        };   
        return(d_msg);    
    },

    // MSG.prototype
    pfdcm_get:                  function() {
        str_help = `

            Return the JSON payload for a 'pfdcm_get' message.

        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        let d_msg = {
            "action": "internalctl",
            "meta": {
                "var":      this.page.DOMpfdcm.get('pfdcm_get'),
                "get":      "value"
            }
        };
        return(d_msg);    
    },

    // MSG.prototype
    pfdcm_set:                  function() {
        str_help = `

            Set the 'pfdcm' PACS detail based on page input data fields.
        
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pfdcm';
        d_PACSinfo              = {
                'serverIP':         this.page.DOMpacsdetail.get('PACS_IP'), 
                'aet':              this.page.DOMpacsdetail.get('PACS_AET'), 
                'aec':              this.page.DOMpacsdetail.get('PACS_AEC'), 
                'serverPort':       this.page.DOMpacsdetail.get('PACS_port') 
        };

        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');

        d_set   = {
            [str_serviceName]: d_PACSinfo
        };

        let d_msg = {
            "action": "internalctl",
            "meta": {
                "var":      "/PACS",
                "set":      d_set
            }
        };

        // Set the status button on the HTML page
        let PACS_config         = document.getElementById("config_PACS-opener");
        PACS_config.innerHTML   = 'Config PACS: Set';
        PACS_config.className   = 'button-help-green pure-button';
        
        return(d_msg);    
    },

    // MSG.prototype
    queryFields_determine:      function() {
        let str_help = `

            This method examines the query fields in the DOM and constructs an
            appropriate query dictionary.

        `;
        let d_query= {};

        for(const str_queryKey of this.page.DOMpacsQR.elements()) {
            if(this.page.DOMpacsQR.get(str_queryKey).length) {
                d_query[str_queryKey] = this.page.DOMpacsQR.get(str_queryKey)
            }
        }
        return(d_query);
    },

    // MSG.prototype
    PACS_query:                  function() {
        let str_help = `

            The main entry point to performing a PACS Query.

        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pacsQuery';
        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');
        let d_on                = this.queryFields_determine();

        this.page.PACSquery_TERMynal.clear([
            '<span data-ty>... PERFORMING QUERY ...</span>',
            '<span data-ty>... Please be patient while running ...</span>'
        ]);

        let d_msg = {
            "action": "PACSinteract",
            "meta": {
                "do":       "query",
                "on":       d_on,
                "PACS":     str_serviceName
            }
        };
        return(d_msg);    
    },

    // MSG.prototype
    PACS_allStudiesRetrieveSpec:    function(d_args) {
        let str_help = `

            Create a list of all the series across the whole study space.

        `;
    },

    // MSG.prototype
    PACS_wholeStudyRetrieveSpec:    function(d_args, lmap_retrieveSpec, lmap_infoSpec) {
        let str_help = `

            Create a list of all the series in a given study that are not
            "inFlight" or "alreadyRetrieved".

        `;

        let studyIndex              = d_args.study;
        let report                  = this.queryPFresponse.json_response.query.report.json[studyIndex];
        let numSeries               = report.body.length;
        let d_ret                   = {
                                        'status':           false,
                                        'ld_retrieveSpec':  [],
                                        'ld_info':          []
                                    }
        for(let series = 0; series < numSeries; series++ ) {
            d_args.series    = series;
            let str_buttonOn = this.page.PACSquery_TERMynal.studySeriesButton_whichStateIsOn(d_args);
            if(str_buttonOn === "retrieve") {
                this.page.PACSquery_TERMynal.studySeriesButton_toggleON(
                                                                    'getInFlightStatus', 
                                                                    d_args
                );
                d_retrieve      = this.PACS_singleSeriesRetrieveSpec(   
                                                                    d_args, 
                                                                    lmap_retrieveSpec,
                                                                    lmap_infoSpec
                                                                );
                if(d_retrieve.status) {
                    d_ret.status            = true;
                    d_ret.ld_retrieveSpec   = d_ret.ld_retrieveSpec.concat(d_retrieve.ld_retrieveSpec);
                    d_ret.ld_info           = d_ret.ld_info.concat(d_retrieve.ld_info);
                }
            }
        }
        // Toggle the state of the study-only button.
        this.page.PACSquery_TERMynal.studySeriesButton_toggleON(
            'getInFlightStatus',
            {
                'study':    d_args.study
            }
        );
        return(d_ret);
    },

    // MSG.prototype
    PACS_singleSeriesRetrieveSpec:  function(d_args, lmap_retrieveSpec, lmap_infoSpec) {
        let str_help = `

            Create a single element list for a single series.

        `;
        d_fields                    = this.PACS_fieldsGetOnStudySeries(d_args);
        if(d_fields.status) {
            lmap_retrieveSpec[0].set(   'StudyInstanceUID',    d_fields.StudyInstanceUID);
            lmap_retrieveSpec[0].set(   'SeriesInstanceUID',   d_fields.SeriesInstanceUID);
            lmap_infoSpec[0].set(       'StudyDate',           d_fields.StudyDate);
            lmap_infoSpec[0].set(       'StudyDescription',    d_fields.StudyDescription);
            lmap_infoSpec[0].set(       'SeriesDescription',   d_fields.SeriesDescription);
        }

        return(this.pfresponse.pacsretrieve.retrieve_push(lmap_retrieveSpec, lmap_infoSpec));
    },

    // MSG.prototype
    PACS_fieldsGetOnStudySeries:    function(d_args) {
        let str_help = `

            Given a study and series index, return a dictionary of
            tag data.

        `;

        let d_ret   = {
            'status':               true,
            'StudyInstanceUID':     "",
            'SeriesInstanceUID':    "",
            'StudyDate':            "",
            'StudyDescription':     "",
            'SeriesDescription':    ""
        }
        let studyIndex              = d_args.study;
        let seriesIndex             = d_args.series;
        let data                    = this.queryPFresponse.json_response.query.data[studyIndex]
        let report                  = this.queryPFresponse.json_response.query.report.json[studyIndex]
        d_ret.StudyInstanceUID      = data.StudyInstanceUID.value                           ? 
                                      data.StudyInstanceUID.value                           : 
                                      'null';
        d_ret.SeriesInstanceUID     = report.bodySeriesUID[seriesIndex].SeriesInstanceUID   ? 
                                      report.bodySeriesUID[seriesIndex].SeriesInstanceUID   : 
                                      'null'  ;
        d_ret.StudyDate             = report.header.StudyDate                               ? 
                                      report.header.StudyDate                               : 
                                      'null';
        d_ret.StudyDescription      = report.header.StudyDescription                        ? 
                                      report.header.StudyDescription                        : 
                                      'null';
        d_ret.SeriesDescription     = report.body[seriesIndex].SeriesDescription            ? 
                                      report.body[seriesIndex].SeriesDescription            : 
                                      'null';
        if(Object.values(d_ret).indexOf('null') > -1)
            d_ret.status            = false
        return(d_ret);
    },

    // MSG.prototype
    PACS_retrieveParse:             function(d_args) {
        let str_help = `

            Based on the semantics of the d_args, this appends to the
            retrieve object's internal list counter, and returns a list
            based on d_args for subsequent calls to PACS_retrieve.

            Input:
            d_args = {
                'study':    (int)studyIndex,
                'series':   (int)seriesIndex
            }


        `;
        let     map_retrieveSpec    = new Map([
                                        ["StudyInstanceUID",     ""],
                                        ["SeriesInstanceUID",    ""]
                                    ]);
        let     map_infoSpec        = new Map([
                                        ["StudyDate",           ""],
                                        ["StudyDescription",    ""],
                                        ["SeriesDescription",   ""]
                                    ]);
        let     lmap_retrieveSpec   = new Array(map_retrieveSpec);
        let     lmap_infoSpec       = new Array(map_infoSpec);
        let     d_retrieve          = {};

        if('study' in d_args && 'series' in d_args) {
            this.page.PACSquery_TERMynal.studySeriesButton_toggleON(
                    'getInFlightStatus', 
                    d_args
                );
            d_retrieve  = this.PACS_singleSeriesRetrieveSpec(
                    d_args,
                    lmap_retrieveSpec,
                    lmap_infoSpec
                );
        }
        if('study' in d_args && !('series' in d_args)) {
            d_retrieve  = this.PACS_wholeStudyRetrieveSpec(
                d_args,
                lmap_retrieveSpec,
                lmap_infoSpec
            );
        }
        return(d_retrieve);
    },

    // MSG.prototype
    PACS_status:                    function(d_args) {
        let str_help = `
            Send a "retrieveStatus" on a given SeriesInstanceUID            
        `;

        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_seriesStatus';
        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');
        
        let d_msg = {
            "action": "PACSinteract",
            "meta": {
                "do":       "retrieveStatus",
                "on":       d_args,
                "PACS":     str_serviceName
            }
        };
        return(d_msg);    
    },

    // MSG.prototype
    PACS_retrieve:                  function(d_args, d_info) {
        let str_help = `

            The main entry point to performing a PACS Retrieve.

            Since the pfdcm backend retrieves on a per-study level

            Input:
            d_args = {
                'series_uid':       <seriesInstanceUID>
            }

            d_info = Info to display in the PACS RETRIEVE termynal.
        `;

        // Build the schemeAuthPath at message compose since
        // DOM elements might have changed asynchronously.
        this.str_schemeAuthPath = this.APIschemeAuthPath_build(); 
        this.str_DOMkey         = 'termynal_pacsRetrieve';
        let str_serviceName     = this.page.DOMpacsdetail.get('PACS_name');

        this.page.PACSretrieve_TERMynal.clear([
            '<span data-ty>... </span',
            '<span data-ty style="color: lightgreen;">... ASKING PACS TO SEND DATA ...</span>',
            '<span data-ty style="color: yellow;">... StudyDate:         ' + d_info.StudyDate + ' ...</span>',
            '<span data-ty style="color: yellow;">... StudyDescription:  ' + d_info.StudyDescription + ' ...</span>',
            '<span data-ty style="color: yellow;">... SeriesDescription: ' + d_info.SeriesDescription + ' ...</span>',
            '<span data-ty style="color: fuchsia;">... Please be patient while requesting ...</span>'
        ]);

        let d_msg = {
            "action": "PACSinteract",
            "meta": {
                "do":       "retrieve",
                "on":       d_args,
                "PACS":     str_serviceName
            }
        };
        return(d_msg);    
    },

    // MSG.prototype
    response_print:                 function() {

        if(this.str_DOMkey == 'termynal_pfdcm') {
            this.page.pfdcm_TERMynal.response_print(this.pfresponse);
        }
        if(this.str_DOMkey == 'termynal_pacsQuery') {
            this.page.PACSquery_TERMynal.response_print(this.queryPFresponse);
        }
        if(this.str_DOMkey == 'termynal_pacsRetrieve') {
            this.page.PACSretrieve_TERMynal.response_print(this.pfresponse);
        }
        if(this.str_DOMkey == 'termynal_seriesStatus') {
            if(this.l_pfresponse.length) {
                let response    = this.l_pfresponse.pop()
                let pfresponse  = new PFResponse();
                pfresponse.set(response);
                pfresponse.parse();
                this.page.seriesStatus_TERMynal.response_print(pfresponse);
            } 
        }
    }
}

/////////
///////// AJAX abstraction object
/////////

function AJAX(Msg) {
    this.str_help = `

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

    // AJAX.prototype
    onError_callBack:       function (xhdr, textStatus, thrownError) {
        hdr = null;
        console.log('Some error was triggered.');
        console.log('textStatus         = ' + textStatus);
        console.log('xhdr.statusText    = ' + xhdr.statusText);
        console.log('xhdr.responseText  = ' + xhdr.responseText);
        console.log('xhdr.status        = ' + xhdr.status);
        console.log('thrownError        = ' + thrownError);
        let str = JSON.stringify(xhdr.responseText, null, 2);
        output(syntaxHighlight(xhdr.status));
        hdr = xhdr;
    },

    // AJAX.prototype
    onBefore_callBack:      function () {
        let debug = new Debug("AJAX.onBefore_callback");
        debug.entering();
        debug.leaving();
    },

    // AJAX.prototype
    onComplete_callBack:    function (jqXHR, textStatus) {
        let debug = new Debug("AJAX.onComplete_callBack");
        debug.entering();
        debug.leaving();
    },

    // AJAX.prototype
    onSuccess_callBack:     function (SRVresp, textStatus, jqXHR) {
        /*
            This is an asynchronous function, so when a button in UI
            is hit triggering a REST call, internal state is not 
            updated until this function is called.
        */

        let debug = new Debug("AJAX.onSuccess_callback");
        debug.entering();

        debug.vlog({ 'message': 'SRVresp', var: SRVresp });

        debug.leaving();
    },

    // AJAX.prototype
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
    let help = `

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

    // Fetch.prototype 
    postData:                       async function (url = '', data = {}) {
        let str_help = `

            Note that "weird" behaviour in comms is most often
            linked to parameter settings below. For example, sending
            any 'headers' seems to trigger an OPTIONS verb in the
            server irrespective of the 'method' value.

        `;

        let debug = new Debug("Fetch.postData");
        debug.entering();

        this.response  = await fetch(url, this.TXoptions);
        debug.leaving();
        return this.response.text();
    },

    // Fetch.prototype 
    checkFirstForErrorsInResponse:  function (response) {
        let debug = new Debug("Fetch.checkFirstForErrorsInResponse");
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

    // Fetch.prototype 
    queryResponse_handle:       function(response) {
        let str_help = `

            In the case of a PACS Query, the response needs to
            be archived in the MSG queryPFresponse object. This
            is to "preserve" the query results over a series of
            subsequent possible Retrieve calls and their responses.

            The strategy to check on this is a bit "hacky". First,
            the check can only be performed when the results of
            a remote query have been received, i.e. asynchronously.
            And secondly, the "trigger" is if the str_DOMkey for this
            call is 'termynal_pacsQuery'.

        `;
        let debug = new Debug("Fetch.queryResponse_handle");
        debug.entering();

        if(this.TX.str_DOMkey == 'termynal_pacsQuery') {
            this.TX.queryPFresponse.set(response);
            this.TX.queryPFresponse.parse();
        }
        debug.leaving();
    },

    // Fetch.prototype 
    seriesResponse_handle:      function(response) {
        let str_help = `

            In the case of a PACS Query, multiple asynchronous
            pfdcm status queries on a series are made. These are
            captured by being "pushed" into an array structure in
            the MSG object. This method really does little more
            than push these responses to the MSG array.

            The strategy to check on this is a bit "hacky". First,
            the check can only be performed when the results of
            a remote query have been received, i.e. asynchronously.
            And secondly, the "trigger" is if the str_DOMkey for this
            call is 'termynal_seriesStatus'.

            Downstream, a response is popped off the array, and 
            processed in the series termynal.

        `;
        let debug = new Debug("Fetch.seriesResponse_handle");
        debug.entering();

        if(this.TX.str_DOMkey == 'termynal_seriesStatus') {
            this.TX.l_pfresponse.push(response);
        }
        debug.leaving();

    },

    // Fetch.prototype 
    handleReponse:              function (response) {
        let debug = new Debug("Fetch.handleResponse");
        debug.entering();

        console.log(response);
        this.TX.pfresponse.set(response);
        this.TX.pfresponse.parse();
        this.queryResponse_handle(response);
        this.seriesResponse_handle(response);
        this.TX.response_print();

        debug.leaving();
        return response;
    },

    // Fetch.prototype 
    handleErrorsInFetch:  async function (response) {
        let debug = new Debug("Fetch.handleErrorsInFetch");
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

    // Fetch.prototype 
    fetch_retry:    async (url, options, n) => {
        let debug = new Debug("Fetch.fetch_retry");
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

    // Fetch.prototype 
    transmitAndProcess: async function (payload) {
        let debug = new Debug("Fetch.transmitAndProcess");
        debug.entering();

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
            debug.leaving();
            return str_response;
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
    d_comms.page.rest       = this;     // Connect the page to this REST

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
    constructor:            REST,

    // REST.protoype
    hello:                      function() {
        let str_help = `
            Say hello to pfdcm
        `;
        this.transmitAndProcess(this.msg.hello());
    },

    // REST.protoype
    pfdcm_get:                  function() {
        let str_help = `
            Get internal state of pfdcm
        `;
        this.transmitAndProcess(this.msg.pfdcm_get());
    },

    // REST.protoype
    pfdcm_set:                  function() {
        let str_help = `
            Set pfdcm internals based on the contents of page input fields.
        `;
        this.transmitAndProcess(this.msg.pfdcm_set());
    },

    // REST.protoype
    PACS_query:                 function() {
        let str_help = `
            Do a PACS Query.
        `;
        page.DOMpacsControl.style_set('RETRIEVE',   {'display': 'none'});
        page.DOMpacsControl.style_set('STATUS',     {'display': 'none'});
        page.PACSretrieve_TERMynal.clear();
        str_queryResponse = this.transmitAndProcess(this.msg.PACS_query());
    },

    // REST.protoype
    PACS_status:                function(d_args) {
        let str_help = `
            Do a PACS status request.

            For a SeriesInstanceUID in <d_args>, construct
            a status message request to pfdcm.
            
            INPUT:
            d_args:
                {
                    'SeriesInstanceUID':    <string>
                }

        `;
        this.transmitAndProcess(this.msg.PACS_status(d_args));        
    },

    // REST.protoype
    studySeries_statusCheck:    function(d_args) {
        let str_help    = `
            Entry point for checking on the status of a specific series,
            referenced by a <studyIndexCount> and a <seriesIndexCount>

            Essentially, this method will determine the actual string
            SeriesInstanceUID from the study/series count, check on 
            pfdcm for status on that instance, and also check in the 
            pacsretrieve object if that series is currently in the
            retrieve set.

            INPUT:
            d_args:
                { 
                    'study':    <studyIndex>,
                    'series':   <seriesIndex>
                }

            RETURN:
            d_ret: {
                'status':   true      -- series lookup successful
                            false     -- series lookup unsuccessful
                'state':    'inQueue' -- in local client queue for retrieval
                            'async'   -- not in local queue, async call done
            }
        `;
        let d_detail                = this.msg.PACS_fieldsGetOnStudySeries(d_args);
        let str_seriesInstanceUID   = d_detail.SeriesInstanceUID;
        let d_ret                   = {
            'status':   false,
            'state':    ''
        };

        if(d_detail.status) {
            let d_series    = {
                'series_uid':   str_seriesInstanceUID
            }

            // First, check if the seriesInstanceUID is in the active
            // retrieve record set
            let b_inQueue = this.msg.pfresponse.pacsretrieve.series_isInQueue(str_seriesInstanceUID);
            if(b_inQueue) {
                // If inQueue, then we populate the return object with 
                // 'inQueue' state. The caller can immediately update local
                // state synchronously based on this information. Note that
                // this logic is a bit superfluous since the "inQueue" is
                // also indicated by the button changing visually as part of
                // the retrieve onClick.
                d_ret.status    = true;
                d_ret.state     = 'inQueue'
            } else {
                // In this instance, we populate the return object with
                // 'async' state and perform a call to the remote pfdcm.
                // The caller does not know the final state *yet*, and 
                // thus needs to do some asynchronous processing.
                d_ret.status    = true;
                d_ret.stats     = 'async'
                this.PACS_status(d_series);
            }
        }
        return d_ret;
    },

    // REST.protoype
    PACS_retrieve:              function(d_args) {
        let str_help = `
            Do a PACS Retrieve.
            
            For "multiple" hits, this method calls the underlying
            message handler appropriately.

            Input:
            d_args = {
                'study':    (int)studyIndex,
                'series':   (int)seriesIndex
            }

        `;

        let zip             = (a,b) => a.map((x,i) => [x, b[i]]);
        let d_retrieve      = this.msg.PACS_retrieveParse(d_args);

        if(d_retrieve.status) {
            for(const [d_on, d_info] of zip(d_retrieve.ld_retrieveSpec, d_retrieve.ld_info)) {
                this.transmitAndProcess(this.msg.PACS_retrieve(d_on, d_info));
            }
        }
    },

    // REST.protoype
    studySeries_statusInFlight:         function(d_args) {
        let str_help = `
            Call a status on a given study/series that is still 
            "InFlight". In other words, an asynchronous receive
            is busy happening. This method simply generates some
            useful output for the user.

            Input:
            d_args = {
                'study':    (int)studyIndex,
                'series':   (int)seriesIndex
            }

        `;

        let d_seriesInfo    = this.msg.PACS_fieldsGetOnStudySeries(
            d_args
        );

        // for this method, trigger a modal display of info that
        // is ultimately handled by the TERMynal
        this.msg.d_meta.modalDialog     = true;

        this.msg.page.PACSquery_TERMynal.seriesStatus_modalShow(d_seriesInfo)
    },

    // REST.protoype
    studySeries_statusOnReceipt:         function(d_args) {
        let str_help = `
            Call a status on a given study/series tuple by communicating
            with the remote server. This is called to determine status
            *after* a retrieve call has completed on the server and
            data has been received by the server.

            Input:
            d_args = {
                'study':    (int)studyIndex,
                'series':   (int)seriesIndex
            }

        `;

        let d_seriesInfo    = this.msg.PACS_fieldsGetOnStudySeries(
            d_args
        );

        let d_series        = {
            'series_uid':   d_seriesInfo.SeriesInstanceUID
        }

        // for this method, trigger a modal display of info that
        // is ultimately handled by the TERMynal
        this.msg.d_meta.modalDialog     = true;

        this.PACS_status(d_series);
    },

    // REST.protoype
    do:                         function(d_op) {
        if('operation' in d_op) {
            switch(d_op['operation']) {
                case 'hello':               this.hello();
                                            break;
                case 'pfdcm_get':           this.pfdcm_get();
                                            break;
                case 'pfdcm_set':           this.pfdcm_set();
                                            break;
                case 'PACS_query':          this.PACS_query();
                                            break;
                case 'PACS_retrieve':       this.PACS_retrieve(d_op['args']);
                                            break;
                case 'studySeries_statusInFlight':  
                                            this.studySeries_statusInFlight(d_op['args']);
                                            break;
                case 'studySeries_statusOnReceipt':  
                                            this.studySeries_statusOnReceipt(d_op['args']);
                                            break;
            }
        }
    },

    // REST.protoype
    transmitAndProcess: function(payload) {
        return this.clientAPI.transmitAndProcess(payload);
    },

}

/////////
///////// TERMynal calling object
/////////

String.prototype.paddingLeft = function (paddingValue) {
    return String(paddingValue + this).slice(-paddingValue.length);
};

function TERMynal(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        The TERMynal object controls/mediates access and contents of any
        termynals on the html page.

    `;

    // The "key" element of this termynal on the html page
    this.str_DOMkey             = str_DOMkey;
    this.DOMoutput              = DOMoutput;

    // Various settings, including colors, rows, etc
    this.d_settings             = d_settings;

    this.page                   = d_settings.page;
    this.contents               = null;

    // A list containing the "default" text to diplay when a screen is cleared.
    this.l_screenClearDefault   = []

}

TERMynal.prototype = {
    constructor:            TERMynal,

    screenClear_setDefault: function(l_lines) {
        let str_help = `

            Simply set the lines to display when termynal "screen" is 
            "cleared".

        `;

        this.l_screenClearDefault   = l_lines;
    },

    // TERMynal.prototype
    clear:                  function(l_screenLines) {
        let str_help = `
        
            Clear the termynal "screen" and optionally set some 
            default "text" on the "screen".

        `;

        let l_lines     = [];

        if(typeof(l_screenLines) != 'undefined') {
            if(Array.isArray(l_screenLines))
                l_lines     = l_screenLines
        } else
            l_lines = this.l_screenClearDefault;

        this.page.DOMtermynal.innerHTML_listset(this.str_DOMkey, l_lines);
    },

    // TERMynal.prototype
    syntaxHighlight:            function(json, ab_subSpaces = false) {
        let str_help = `

            Convert an input string to colorized html string suitable
            for termynal. Note the return from this function still needs to
            split into a list!

        `;
        if(ab_subSpaces) 
            json    = json.replace(/ /g, "&nbsp;");
        json    = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    },

    // TERMynal.prototype
    to_termynalResponseGenerate_fromText:   function(str_text, ab_trimLeft, astr_style) {
        let str_help = `

            Prepare a list containing all the lines that should be
            streamed to a target termynal.

            With a multi-line input, convert to a list of response-string 
            to termynal friendly html.

        `;
        let str_style   = '';
        let l_termynal  = [];
        // Sanitize the string of any spurious ANSI color codes...
        str_text        = str_text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")
        let l_response  = str_text.split('\n')

        switch(typeof(astr_style)) {
            case    'undefined':
                break;
            case    'string':
                str_style   = astr_style;
                break;
        }

        l_termynal = this.sprintf(l_response, ab_trimLeft, str_style);
        return(l_termynal);
    },

    // TERMynal.prototype
    to_termynalResponseGenerate:    function(pfresponse, astr_style) {
        let str_help = `

            Prepare a list containing all the lines that should be
            streamed to a target termynal.

            Convert a multi-line list of response-string to termynal
            friendly html. Each line of response string needs its
            own html tagged line of form:

                    <span data-ty>some string...</span>

            This method not only performs the to-termynalization
            but also attempts some indenting if syntax highlighting
            has been 

        `;
        let str_style   = '';
        switch(typeof(astr_style)) {
            case    'undefined':
                break;
            case    'string':
                str_style   = astr_style;
                break;
        }

        // The array to hold all the lines for the termynal
        let l_termynal      = [];
        let b_subSpaces     = false;
        let b_trimLeft      = false;

        // Check for optional JSON syntax highlighting. If true, 
        // then the response body needs to be syntaxed -- as a 
        // string, and then split back into a list.
        if(this.page.b_jsonSyntaxHighlight) {
            b_subSpaces         = true;
            str_jsonColorized   = this.syntaxHighlight(pfresponse.str_bodyResponse, b_subSpaces);
            str_jsonColorized   = str_jsonColorized.replace(/&amp;/g, "&");

            pfresponse.response_bodyStringUpdate(str_jsonColorized);
        }

        b_subSpaces     = false;
        l_termynal      = this.sprintf(pfresponse.l_response, b_trimLeft, '', b_subSpaces);
        return(l_termynal);
    },

    // TERMynal.prototype
    sprintf:                    function(al_lines, 
                                            ab_trimLeft         = false, 
                                            astr_groupStyle     = '',
                                            ab_subSpaces        = true) {
        let str_help = `

            A simple method that takes a list of "lines" and makes them
            termynal friendly.

        `;

        let l_termynal  = [];
        for(str_line of al_lines) {
            if(str_line.length) {
                if(ab_trimLeft)  str_line    = str_line.trimStart();
                if(ab_subSpaces) str_line    = str_line.replace(/ /g, "&nbsp;");
                l_termynal.push("<span data-ty " + astr_groupStyle +" >" + str_line + "</span>");
            }                
        }
        return(l_termynal);
    },

    // TERMynal.prototype
    ltag_wrapLineGroup:         function(astr_prefix, al_lines, astr_suffix) {
        let str_help = `

            Wrap around the list of lines in <al_lines>, creating a new list:

            [
                <astr_prefix>,
                [<al_lines>]
                <astr_suffix>,
            ]
        `;

        let l_termynal  = [];
        l_termynal.push(astr_prefix);
        l_termynal      = l_termynal.concat(al_lines);
        l_termynal.push(astr_suffix);
        return(l_termynal);
    },

    // TERMynal.prototype
    studySeriesButton_whichStateIsOn:   function(d_args) {
        let str_help = `

            This method returns which of the three possible
            button states is currently "ON", i.e. being
            displayed in the UI.

            The button state is one of:

                    - retrieve
                    - getInFlightStatus
                    - getInfo
        
            Input:
            d_args = {
                'study':        <int>study,
                'series':       <int>series
            }

            Return:
            <str_buttonState>
        `;

        let l_buttonSpec    = ['retrieve', 'getInFlightStatus', 'getInfo'];
        let str_buttonOn    = "";
        let str_DOMbase     = 'Study-' + d_args.study; 
        if('series' in d_args) {
            str_DOMbase     += '-Series-' + d_args.series;
        }
        for(str_button of l_buttonSpec) {
            buttonHTML      = document.getElementById(str_DOMbase + '-' + str_button);
            if(buttonHTML.style.display === 'block' || buttonHTML.style.display === "") {
                str_buttonOn    = str_button;
                break;
            }
        }
        return str_buttonOn;
    },

    // TERMynal.prototype
    studySeriesButton_toggleON:         function(astr_display, d_args) {

        let str_help = `

            Toggle the visible state of a specific study/series
            button. For a given 'display' choice, set that
            button to 'block' and the others to 'none'.

            If the <d_args> does not contain a 'series' key, then
            change the study button.

            <buttonChoiceToMakeVisible> is one of:

                    - retrieve
                    - getInFlightStatus
                    - getInfo
        
            Input:
            d_args = {
                'study':        <int>study,
                'series':       <int>series
            }

            Return:
            d_ret = {
                'status':       true|false,
            }

        `;

        let d_ret               = {
            'status':   false
        }
        let l_buttonSpec        = ['retrieve', 'getInFlightStatus', 'getInfo'];
        
        if(l_buttonSpec.includes(astr_display)) {
            let str_DOMbase     = 'Study-' + d_args.study; 
            if('series' in d_args) {
                str_DOMbase     += '-Series-' + d_args.series;
            }
            for(str_button of l_buttonSpec) {
                buttonHTML      = document.getElementById(str_DOMbase + '-' + str_button);
                if(str_button === astr_display) {
                    buttonHTML.style.display = "block";
                } else {
                    buttonHTML.style.display = "none";
                }
            }
            d_ret.status = true;
        }

        return d_ret;
    },

    // TERMynal.prototype
    studySeriesButton_processDOMid:     function(d_args) {
        let str_help = `
    
            Processes a button element on the DOM in the context of
            study/series operations.

            Note, this is only string operation on the button 
            core template in the context of a study/series count.

            The button does not necessarily yet exist in the DOM!
        
            Input:
            d_args = {
                'study':        <int>study,
                'series':       <int>series
                'buttonHTML':   <buttonHTMLToProcess>
            }

            Return:
            d_ret = {
                'status':       true|false,
                'buttonHTML':   <processedButtonString>
            }

        `;
        let d_ret = {
            'status':       true,
            'buttonHTML':   ''
        }
        let str_button          = d_args.buttonHTML;
        let seriesCount         = d_args.series;
        let str_seriesCount1    = (seriesCount+1).toString().padStart(2, '0');
        let str_currentStudy1   = (this.currentStudyIndex+1).toString().padStart(4, ' ');

        if(str_button.includes('/SeriesCount')) {
            // We check on the status of a "series" as we process the DOM
            // HTML. The idea is to possibly toggle a different button option
            // display visibility. 
            d_seriesStatus      = this.page.rest.studySeries_statusCheck( {
                                                'study':    this.currentStudyIndex, 
                                                'series':   seriesCount
                                    });
        }

        str_button          = str_button.replace(/\/StudyIndex1\//g,    str_currentStudy1);
        str_button          = str_button.replace(/\/StudyIndex\//g,     this.currentStudyIndex);
        str_button          = str_button.replace(/\/SeriesCount1\//g,   str_seriesCount1);
        str_button          = str_button.replace(/\/SeriesCount\//g,    seriesCount);
        d_ret.buttonHTML    = str_button;

        return d_ret;

    },

    // TERMynal.prototype
    studySeriesButton_processOnClick:  function(d_args) {
        let str_help = `
    
            Processes the 'onclick' attribute of a button element 
            in the DOM in the context of study/series operations.

            Note, this is a string-only operation on the button 
            core template in the context of a study/series count.
            Since the button might not yet exist in the DOM, this 
            method does not always result in DOM updates on 
            execution! 

            Input:
            d_args = {
                'context':      'retrieve'|'getInFlightStatus'|'getInfo'
                'study':        <int>study,
                'series':       <int>series
                'buttonHTML':   <buttonStringToProcess>
            }

            Return:
            d_ret = {
                'status':       true|false,
                'buttonHTML':   <processedButtonString>
            }

        `;
        let d_ret = {
            'status':       false,
            'buttonHTML':   ''
        }

        let str_button          = d_args.buttonHTML;
        let seriesCount         = d_args.series;
        let d_contextMap        = {
            'retrieve':             'PACS_retrieve',
            'getInFlightStatus':    'studySeries_statusInFlight',
            'getInfo':              'studySeries_statusOnReceipt'
        }

        if(str_button.includes('/StudyIndex') && !str_button.includes('/SeriesCount')) {
            d_ret.status        = true;
            str_button          = str_button.replace(
                        'onclick =  "'+ d_args.context +  '"',
                        `onclick =  "return post.do({
                                    'operation': '` + d_contextMap[d_args.context] + `',
                                        'args': {
                                                'study': ` + this.currentStudyIndex +`
                                                }
                                    })"`
            );
        }
        if(str_button.includes('/SeriesCount')) {
            d_ret.status        = true;
            str_button          = str_button.replace(
                        'onclick =  "'+ d_args.context +  '"',
                        `onclick =  "return post.do({
                                    'operation': '` + d_contextMap[d_args.context] + `',
                                        'args': {
                                                'study': ` + this.currentStudyIndex +`,
                                                'series':` + seriesCount            +`
                                                }
                                    })"`
            );
        }
        d_ret.buttonHTML    = str_button;
        return d_ret;
    },

    // TERMynal.prototype
    button_process:             function(astr_button, currentSeriesIndex) {
        let str_help = `
            
            A dispatching function that process the per-study and per-series
            button HTML text in the context of a study and series.

            Input:
            <astr_button>   HTML string of the button markup to process

            Return:
            String of processed HTML markup

        `        
        // Process the onclick of each button context
        let     d_buttonRet = {
                'status':       false,
                'buttonHTML':   astr_button
        };

        // First the onclick of the astr_button
        for(str_context of ['retrieve', 'getInFlightStatus', 'getInfo']) {
            d_buttonRet = this.studySeriesButton_processOnClick( {
                'context':      str_context,
                'buttonHTML':   d_buttonRet.buttonHTML,
                'series':       currentSeriesIndex,
                'study':        this.currentStudyIndex
            });
        }

        // Now the name/id and other string info
        d_buttonRet     = this.studySeriesButton_processDOMid({
            'buttonHTML':   d_buttonRet.buttonHTML,
            'series':       currentSeriesIndex,
            'study':        this.currentStudyIndex
        })

        // Finally, return the processed markup
        if(d_buttonRet.status)
            return d_buttonRet.buttonHTML;
    },

    // TERMynal.prototype
    lineBlock_packageAndStyle:  function(   al_lines, 
                                            af_perLineFunc      = null,
                                            astr_groupStyle     = '"', 
                                            astr_elementOpen    = '', 
                                            astr_elementClose   = '') {
        let str_help = `
    
            Wraps a block of TERMynal lines in a div block with styling to
            reduce the height and apply optional additional styling.
    
        `;

        let l_divBlock      = '';
        l_divBlock          = this.ltag_wrapEachLine(
            '<div style="display: flex; height:20px;' + astr_groupStyle + '>' + astr_elementOpen,
            af_perLineFunc,
            al_lines,
            astr_elementClose + '</div>'
        );
        return(l_divBlock);
    },

    // TERMynal.prototype
    ltag_wrapEachLine:          function(astr_prefix, f_prefix, al_lines, astr_suffix) {
        let str_help = `

            Wrap around each line in <al_lines>, creating a new string:

                        <astr_prefix><str_line><astr_suffix>

            where <str_line> is each line in <al_lines>.

            If <f_prefix> is non-null and a function, then process the 
            <astr_prefix> with <f_prefix>, i.e.
            
                        <f_prefix>(<astr_prefix>, <loopIndex>)

            <f_prefix> should have a second argument which is the current
            loop index of the current position in <al_lines>.

            Some character substitution is performed. If the <astr_prefix>
            contains:

                '/StudyIndex/':     replaced by the current study index+1
                '/SeriesCount/':    replaced by the current series index+1

        `;

        let l_termynal  = [];
        let seriesCount = 0;
        let str_prefix  = astr_prefix;
        for(str_line of al_lines) {
            if(f_prefix !== null) {
                str_prefix = f_prefix(str_prefix, seriesCount);
            } 
            l_termynal.push(str_prefix + str_line + astr_suffix);
            seriesCount++;
            str_prefix = astr_prefix;
        }
        return(l_termynal);
    },

    // TERMynal.prototype
    tprintf:                    function(al_lines) {
        let str_help = `

            A simple method that takes a list of "lines" and "prints"
            them in a termynal.

        `;

        this.DOMoutput.innerHTML_listadd(this.str_DOMkey, al_lines);
    }
}

/////////
///////// TERMynal_pfdcm calling object with some specializations
/////////

function TERMynal_pfdcm(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A pfdcm "specialized" class of the base TERMynal.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);
}

TERMynal_pfdcm.prototype                = Object.create(TERMynal.prototype);
TERMynal_pfdcm.prototype.constructor    = TERMynal_pfdcm;
TERMynal_pfdcm.prototype.response_print = function(pfresponse) {
    let str_help = `

        pfdcm - specific TERMynal response handling.

    `;
    this.contents               = pfresponse;
    let l_termynal              = this.to_termynalResponseGenerate(pfresponse,
                                        'style = "padding: 0px 0px;"');
    this.tprintf(l_termynal);
}

/////////
///////// TERMynal_PACSquery calling object with some specializations
/////////

function TERMynal_PACSquery(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A PACS "specialized" class of the base TERMynal. 

        The constructor mostly defines the space of input button
        templates for the UI.

        Three button types are defined, and depending on context
        are toggled display on or off.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);
    this.currentStudyIndex              = 0;
    this.totalNumberOfStudies           = 0;
    this.str_buttonStudy     = `<input  type    =  "button" 
                                        onclick =  "retrieve" 
                                        value   =  "&#xf019 /StudyIndex1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;"
                                        id      =  "Study-/StudyIndex/-retrieve" 
                                        name    =  "Study-/StudyIndex/-retrieve" 
                                        class   =  "pure-button 
                                                    pure-button-primary 
                                                    fas fas-download"></input>
                                <input type     =  "button" 
                                        onclick =  "getInFlightStatus"
                                        value   =  "&#xf0ae /StudyIndex1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;
                                                    display: none;"
                                        id      =  "Study-/StudyIndex/-getInFlightStatus" 
                                        name    =  "Study-/StudyIndex/-getInFlightStatus" 
                                        class   =  "pure-button 
                                                    pure-button-primary button-orange
                                                    fas fas-tasks"></input>
                                <input type     =  "button" 
                                        onclick =  "getInfo"
                                        value   =  "&#xf05a /StudyIndex1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;
                                                    display: none;"
                                        id      =  "Study-/StudyIndex/-getInfo" 
                                        name    =  "Study-/StudyIndex/-getInfo" 
                                        class   =  "pure-button 
                                                    pure-button-primary button-green
                                                    fas fas-info-circle"></input>
                                `;

    this.str_buttonSeries    = ` <input type    =  "button" 
                                        onclick =  "retrieve"
                                        value   =  "&#xf019 /StudyIndex1/./SeriesCount1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;"
                                        id      =  "Study-/StudyIndex/-Series-/SeriesCount/-retrieve" 
                                        name    =  "Study-/StudyIndex/-Series-/SeriesCount/-retrieve" 
                                        class   =  "pure-button 
                                                    pure-button-primary
                                                    fas fas-download"></input>
                                <input type     =  "button" 
                                        onclick =  "getInFlightStatus"
                                        value   =  "&#xf0ae /StudyIndex1/./SeriesCount1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;
                                                    display: none;"
                                        id      =  "Study-/StudyIndex/-Series-/SeriesCount/-getInFlightStatus" 
                                        name    =  "Study-/StudyIndex/-Series-/SeriesCount/-getInFlightStatus" 
                                        class   =  "pure-button 
                                                    pure-button-primary button-orange
                                                    fas fas-tasks"></input>
                                <input type     =  "button" 
                                        onclick =  "getInfo"
                                        value   =  "&#xf05a /StudyIndex1/./SeriesCount1/ " 
                                        style   =  "font-family: FontAwesome, monospace;  
                                                    padding: .1em .4em;
                                                    display: none;"
                                        id      =  "Study-/StudyIndex/-Series-/SeriesCount/-getInfo" 
                                        name    =  "Study-/StudyIndex/-Series-/SeriesCount/-getInfo" 
                                        class   =  "pure-button 
                                                    pure-button-primary button-green
                                                    fas fas-info-circle"></input>
                                `;

}

TERMynal_PACSquery.prototype                 = Object.create(TERMynal.prototype);
TERMynal_PACSquery.prototype.constructor     = TERMynal_PACSquery;

TERMynal_PACSquery.prototype.pfresponseError_show    = function(pfresponse) {
    let str_help = `

        A simple method for reporting errors in the PACS interaction.

    `;

    let json_response   = pfresponse.json_response;
    let str_errorMsg    = json_response.msg;
    let str_suggest;

    this.clear([]);

    if(str_errorMsg == 'Invalid PACS specified!') {
        str_suggest     = "Please verify PACS settings using the 'Config PACS' button.";
    }

    l_termynal          = [
        '<span data-ty style="color:red;">An error was caught in the PACS interaction!</span>',
        '<span data-ty style="color:red;">Reported issue was:</span>',
        '<span data-ty style="color:yellow;">' + str_errorMsg + '</span>',
        '<span data-ty style="color:yellow;">' + str_suggest  + '</span>',
    ];
    this.DOMoutput.innerHTML_listadd(this.str_DOMkey, l_termynal);
}

TERMynal_PACSquery.prototype.seriesStatus_modalShow  = function(json_data) {
    let str_help = `

        A simple modal window with information on a given series.

    `;

    const modal     = document.getElementById('seriesModalDialog');
    const close     = document.getElementById('close');
    const modalBody = document.getElementById('seriesModalDialogBody');

    modal.showModal();

    modalBody.innerHTML = `
        <table>
        <caption><span class="blinking">IN FLIGHT</span></caption>
        <tbody>
            <tr>
                <td>Study Description</td><td>`     + json_data.StudyDescription    + `</td>
            </tr>
            <tr>
                <td>StudyInstanceUID</td><td>`      + json_data.StudyInstanceUID    + `</td>
            </tr>
            <tr>
                <td>Series Description</td><td>`    + json_data.SeriesDescription   + `</td>
            </tr>
            <tr>
                <td>SeriesInstanceUID</td><td>`     + json_data.SeriesInstanceUID   + `</td>
            </tr>
        </tbody>
        </table>
    `;

    close.addEventListener('click', () => {
        modal.close('cancelled');
    })

    modal.addEventListener('cancel', () => {
        modal.close('cancelled');
    });
      
    // close when clicking on backdrop
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close('cancelled');
        }
    });   
}

TERMynal_PACSquery.prototype.header_anonymize       = function(str_header) {
    const str_help = `
        If the ANON mask is ON, then this method will "anonymize" 
        the display of the header. Essentially, the method simply 
        processes the text report and returns a lightly edited 
        version of the same.

        Note that this "anonymization" is not in place. If the
        header is aleady "printed", toggling the ANON mask ON will
        only affect the next display of header information.

        Return:
        An edited version of the input <str_header>.
    `;

    const l_header          = str_header.split('\n');
    const l_headerAnon      = [];
    for(let str_headerLine of l_header) {
        for(let str_headerField of this.page.l_PACSQRanon) {
            if(str_headerLine.includes(str_headerField)) {
                let l_keyValue          = str_headerLine.split(str_headerField);
                str_PHI             = l_keyValue[1];
                str_clean           = str_PHI.replace(/\S/gi,  '*');
                str_clean           = str_clean.slice(0, -4);
                str_headerLine      = l_keyValue[0] + str_headerField + str_clean;
            }
        }
        l_headerAnon.push(str_headerLine);
    }
    const str_headerAnon    = l_headerAnon.join('\n');
    return str_headerAnon;
},

TERMynal_PACSquery.prototype.response_print          = function(pfresponse) {
    let str_help = `

        PACS - specific TERMynal response handling.

        The input <pfresponse> is typically the response from the remote query.
        However, for a response with many "hits", an integer can be passed 
        which denotes a specific "hit" in the response to display.

        This method is responsible for showing the QUERY result output.

    `;

    switch(typeof(pfresponse)) {
        case    'undefined':    break;
        case    'object':       this.contents           = pfresponse;
                                break;
        case    'number':       this.currentStudyIndex  = pfresponse;
                                break;
    };
      
    if(!this.contents.json_response.status) {
        this.pfresponseError_show(this.contents);
    } else {
        this.clear([]);
        this.totalNumberOfStudies   = this.contents.json_response.query.report.rawText.length;
        const d_report              = this.contents.json_response.query.report.rawText[this.currentStudyIndex];

        let l_navFirstNext = [
            ' First Study                                                    Next Study ',
        ];

        let l_navLastPrev = [
            ' Last Study                                                 Previous Study ',
        ];

        let l_position          = [
            ' Showing Study ' + (this.currentStudyIndex+1) + '/' + this.totalNumberOfStudies,
        ];

        b_trimLeftSpace         = false;
        let lt_navFirstNext     = this.sprintf(
                                        l_navFirstNext,  
                                        b_trimLeftSpace,  
                                        'style="color: lightgreen;"'
                                    );
        let lt_navLastPrev      = this.sprintf(
                                        l_navLastPrev,   
                                        b_trimLeftSpace,  
                                        'style="color: lightgreen;"'
                                    );
        let lt_position         = this.sprintf(
                                        l_position,      
                                        b_trimLeftSpace,  
                                        'style="color: fuchsia;"'
                                    );
        let str_header          = d_report['header'];
        if(this.page.b_anonDataMask) {
            str_header          = this.header_anonymize(str_header);
        }
        let str_body            = d_report['body'];
        str_body                = str_body.replace(/SeriesDescription/gi, '');
        let l_termynalHeader    = this.to_termynalResponseGenerate_fromText(
                                        str_header, 
                                        false, 
                                        'style="color: yellow;"'
                                    );
        let l_termynalBody      = this.to_termynalResponseGenerate_fromText(
                                        str_body,   
                                        true,  
                                        'style="color: cyan;"'
                                    );
        let ltwrap_navFirstNext = this.lineBlock_packageAndStyle(
                                        lt_navFirstNext, 
                                        null, 
                                        '"',
                                        this.page.upArrow_inputButtonCreate()       + '</input>', 
                                        this.page.rightArrow_inputButtonCreate()    + '</input>'
                                    );
        let ltwrap_navLastPrev  = this.lineBlock_packageAndStyle(
                                        lt_navLastPrev, 
                                        null, 
                                        '"', 
                                        this.page.downArrow_inputButtonCreate()     + '</input>', 
                                        this.page.leftArrow_inputButtonCreate()     + '</input>'
                                    );
        let ltwrap_position     = this.lineBlock_packageAndStyle(
                                        lt_position, 
                                        this.button_process.bind(this), 
                                        '"', 
                                        this.str_buttonStudy
                                    );
        let ltwrap_body         = this.lineBlock_packageAndStyle(
                                        l_termynalBody, 
                                        this.button_process.bind(this),
                                        '"', 
                                        this.str_buttonSeries + '&nbsp;'
                                    );
        let ltwrap_header       = this.lineBlock_packageAndStyle(l_termynalHeader);

        this.tprintf(ltwrap_navFirstNext);
        this.tprintf(ltwrap_navLastPrev);
        this.tprintf(this.sprintf([' ']));
        this.tprintf(ltwrap_position);
        this.tprintf(this.sprintf([' ']));
        this.tprintf(ltwrap_header);
        this.tprintf(ltwrap_body);

        page.DOMpacsControl.style_set('RETRIEVE', {'display': 'block'});
    }
}

/////////
///////// TERMynal_PACSretrieve calling object with some specializations
/////////

function TERMynal_PACSretrieve(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A PACS "specialized" class of the base TERMynal.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);

}

TERMynal_PACSretrieve.prototype                 = Object.create(TERMynal.prototype);
TERMynal_PACSretrieve.prototype.constructor     = TERMynal_PACSretrieve;

TERMynal_PACSretrieve.prototype.pfresponseError_show    = function(pfresponse) {
    let str_help = `

        A simple method for reporting errors in the PACSretrieve interaction.

    `;

    let json_response   = pfresponse.json_response;
    let str_errorMsg    = json_response.msg;
    let str_suggest;

    this.clear([]);

    if(str_errorMsg == 'Invalid PACS specified!') {
        str_suggest     = "Please verify PACS settings using the 'Config PACS' button.";
    }

    l_termynal          = [
        '<span data-ty style="color:red;">An error was caught in the PACS interaction!</span>',
        '<span data-ty style="color:red;">Reported issue was:</span>',
        '<span data-ty style="color:yellow;">' + str_errorMsg + '</span>',
        '<span data-ty style="color:yellow;">' + str_suggest  + '</span>',
    ];
    this.DOMoutput.innerHTML_listadd(this.str_DOMkey, l_termynal);
}

TERMynal_PACSretrieve.prototype.response_print          = function(pfresponse) {
    let str_help = `

        PACSretrieveStatus - specific TERMynal response handling.

    `;

    switch(typeof(pfresponse)) {
        case    'undefined':    break;
        case    'object':       this.contents           = pfresponse;
                                break;
    };
      
    if(!this.contents.json_response.status) {
        this.pfresponseError_show(this.contents);
    } else {
        this.clear([]);

        let d_result                = pfresponse.json_response.retrieve;

        // Find the SeriesInstanceUID in the returned successful command string
        let str_cmd                 = d_result.command;
        let l_cmd                   = str_cmd.split(" ");
        let str_SeriesInstanceKeyV  = l_cmd.find(a => a.includes("SeriesInstanceUID"));
        if(typeof str_SeriesInstanceKeyV !== 'undefined') {
            let b_trimLeftSpace         = false;
            let str_seriesInstanceUID   = str_SeriesInstanceKeyV.split("=")[1];
            let l_displayInfo           = pfresponse.pacsretrieve.map_retrieve.get('l_displayInfo');
            let set_series              = pfresponse.pacsretrieve.set_series;
            let seriesIndex             = [...set_series].indexOf(str_seriesInstanceUID);
            let d_displayInfo           = l_displayInfo[seriesIndex];
            let str_out                 = "...SUCCESS... " + 
                                          d_displayInfo.StudyDate           + ": " + 
                                          d_displayInfo.StudyDescription    + ": " +
                                          d_displayInfo.SeriesDescription;
            let l_termynalOut           = this.to_termynalResponseGenerate_fromText(str_out, b_trimLeftSpace, 'style="color: lightgreen;"');
            let lt_termynalOut          = this.lineBlock_packageAndStyle(l_termynalOut);
            this.tprintf(lt_termynalOut);
            d_studySeries               = this.page.rest.msg.queryPFresponse.querySeries_toStudySeriesIndex(
                                                str_seriesInstanceUID
                                            );
            if(d_studySeries.status) {
                d_toggle = this.studySeriesButton_toggleON(
                    'getInfo',
                    d_studySeries
                );
            }
            page.DOMpacsControl.style_set('STATUS', {'display': 'block'});

        } else {
            let str_out                 = "No SeriesInstanceUID found in retrieve command string!";
            let l_termynalOut           = this.to_termynalResponseGenerate_fromText(str_out, b_trimLeftSpace, 'style="color: red;"');
            let lt_termynalOut          = this.lineBlock_packageAndStyle(l_termynalOut);
            this.tprintf(lt_termynalOut);
        }

    }
}

/////////
///////// TERMynal_seriesStatus calling object with some specializations
/////////

function TERMynal_seriesStatus(str_DOMkey, DOMoutput, d_settings) {
    this.help = `

        A termynal that outputs series status information.

    `;

    TERMynal.call(this, str_DOMkey, DOMoutput, d_settings);

}

TERMynal_seriesStatus.prototype                 = Object.create(TERMynal.prototype);
TERMynal_seriesStatus.prototype.constructor     = TERMynal_seriesStatus;

TERMynal_seriesStatus.prototype.pfresponseError_show    = function(pfresponse) {
    let str_help = `

        A simple method for reporting errors in the PACSretrieve interaction.

    `;

    let json_response   = pfresponse.json_response;
    let str_errorMsg    = json_response.msg;
    let str_suggest;

    this.clear([]);

    if(str_errorMsg == 'Invalid PACS specified!') {
        str_suggest     = "Please verify PACS settings using the 'Config PACS' button.";
    }

    l_termynal          = [
        '<span data-ty style="color:red;">An error was caught in the PACS interaction!</span>',
        '<span data-ty style="color:red;">Reported issue was:</span>',
        '<span data-ty style="color:yellow;">' + str_errorMsg + '</span>',
        '<span data-ty style="color:yellow;">' + str_suggest  + '</span>',
    ];
    this.DOMoutput.innerHTML_listadd(this.str_DOMkey, l_termynal);
}

TERMynal_seriesStatus.prototype.seriesStatus_modalShow  = function(json_data) {
    let str_help = `

        A simple modal window with information on a given series.

    `;

    const modal     = document.getElementById('seriesModalDialog');
    const close     = document.getElementById('close');
    const modalBody = document.getElementById('seriesModalDialogBody');


    let d_retrieve              = json_data.retrieveStatus;
    let str_msg                 = d_retrieve.msg;
    let str_seriesInstanceUID   = d_retrieve.seriesUID;
    let numDCMfiles             = d_retrieve.numDCMfiles;
    let d_studySeries           = this.page.rest.msg.queryPFresponse.querySeries_toStudySeriesIndex(
                                        str_seriesInstanceUID
                                    );
    let d_fields                = this.page.rest.msg.PACS_fieldsGetOnStudySeries(d_studySeries);

    modal.showModal();

    modalBody.innerHTML = `
        <table>
        <caption>` + str_msg + `</caption>
        <tbody>
            <tr>
                <td>Study Description</td><td>`     + d_fields.StudyDescription     + `</td>
            </tr>
            <tr>
                <td>StudyInstanceUID</td><td>`      +  d_fields.StudyInstanceUID    + `</td>
            </tr>
            <tr>
                <td>Series Description</td><td>`    + d_fields.SeriesDescription    + `</td>
            </tr>
            <tr>
                <td>SeriesInstanceUID</td><td>`     + str_seriesInstanceUID         + `</td>
            </tr>
            <tr>
                <td>Number of Received Images</td><td>` + numDCMfiles               + `</td>
            </tr>
        </tbody>
        </table>
    `;

    close.addEventListener('click', () => {
        modal.close('cancelled');
    })

    modal.addEventListener('cancel', () => {
        modal.close('cancelled');
    });
      
    // close when clicking on backdrop
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close('cancelled');
        }
    });   

},

TERMynal_seriesStatus.prototype.response_print          = function(pfresponse) {
    let str_help = `

        Series status specific output response handling, as well
        as modal data print conditional handling.

    `;
      
    this.clear([]);
    // Print the actual text of the pfresponse
    this.tprintf(
            this.to_termynalResponseGenerate(
                            pfresponse,
                            'style = "padding: 0px 0px;"'
            )
    );
    json_response       = pfresponse.json_response;

    if(this.page.rest.msg.d_meta.modalDialog) {
        // Here we use an html5 modal to nicely show some additional
        // status data
        this.seriesStatus_modalShow(json_response);
        this.page.rest.msg.d_meta.modalDialog = false;
    } else {
        if(json_response.status) {
            // This specific series exists in the remote server.
            // We now process the rather ideosyncratic return contents
            // to extract the SeriesInstanceUID, map it to a
            // study/series tuple and then update the corresponding button
            // in the DOM.
            str_seriesInstanceUID   = json_response.retrieveStatus.seriesUID;
            d_studySeries           = this.page.rest.msg.queryPFresponse.querySeries_toStudySeriesIndex(
                str_seriesInstanceUID
            );
            if(d_studySeries.status) {
                d_toggle = this.studySeriesButton_toggleON(
                                    'getInfo',
                                    d_studySeries
                            );
            }   
        }
    }
}

/////////
///////// A Page object that describes the HTML version elements from a 
///////// logical perspective.
/////////

function Page() {
    this.str_help = `

        The Page object defines/interacts with the html page.

        The page element strings are "defined" here, and letious
        DOM objects that can interact with these elements are also
        instantiated.
        
    `;

    this.b_jsonSyntaxHighlight      = true;
    this.b_anonDataMask             = false;
    document.onkeydown              = this.checkForArrowKeyPress;

    // Link to the REST object that works "in" the page. This object
    // provides access to various classes, including the transmission
    // handler and MSG object that constructs payloads for communication.
    this.rest                       = null;

    // Keys parsed from the URL
    this.l_urlParamsBasic = [   
        "pfdcm_IP", 
        "pfdcm_port", 
        "PACS_IP", 
        "PACS_port", 
        "PACS_AET", 
        "PACS_AEC", 
        "PACS_AETL",
        "PACS_name",
    ];

    // Specific PACS only keys
    this.l_PACSdetail   = [
        "PACS_IP", 
        "PACS_port", 
        "PACS_AET", 
        "PACS_AEC", 
        "PACS_AETL",
        "PACS_name"
    ];

    // DOM keys related to the pfdcm parts of the page
    this.l_pfdcm = [
        "pfdcm_get",
        "pfdcm_out",
        "data_pfdcm"
    ];

    // DOM keys related to the PACS Q/R parts of the page
    this.l_PACSQR   = [
        "PatientID",
        "PatientName",
        "AccessionNumber",
        "StudyDate",
        "Modality",
        "PerformedStationAETitle"
    ]

    // DOM keys related to fields in the PACS Q/R that might
    // needs be "anonymized" (and similarly parts of the 
    // QUERY header text termynal display)
    this.l_PACSQRanon   = [
        "PatientID",
        "PatientName",
        "AccessionNumber"
    ]


    // Concat the basic URL with the PACSQR since PACS fields can
    // be passed in the URL.
    this.l_urlParams    = this.l_urlParamsBasic.concat(this.l_PACSQR);

    // DOM keys related to termynal parts of the page
    this.l_termynal = [
        "termynal_pfdcm",
        "termynal_pacsQuery",
        "termynal_pacsRetrieve",
        "termynal_seriesStatus"
    ];

    this.l_PACScontrol = [
        "clear",
        "QUERY",
        "RETRIEVE",
        "STATUS"
    ];

    // DOM obj elements --  Each object has a specific list of page key
    //                      elemnts that it process to provide page
    //                      access functionality
    this.DOMurl         = new DOM(this.l_urlParams);
    this.DOMpfdcm       = new DOM(this.l_pfdcm);
    this.DOMpacsdetail  = new DOM(this.l_PACSdetail);
    this.DOMpacsQR      = new DOM(this.l_PACSQR);
    this.DOMtermynal    = new DOM(this.l_termynal)
    this.DOMpacsControl = new DOM(this.l_PACScontrol);

    this.pfdcm_TERMynal = new TERMynal_pfdcm(
        "termynal_pfdcm", 
        this.DOMtermynal, 
        {
            "rows":     50,
            "scheme":   "dark",
            "page":     this
        }
    );

    this.PACSquery_TERMynal  = new TERMynal_PACSquery(
        "termynal_pacsQuery",
        this.DOMtermynal, 
        {
            "rows":     50,
            "scheme":   "dark",
            "page":     this
        }
    );

    this.PACSretrieve_TERMynal  = new TERMynal_PACSretrieve(
                                        "termynal_pacsRetrieve",
                                        this.DOMtermynal, 
                                        {
                                            "rows":     50,
                                            "scheme":   "dark",
                                            "page":     this
                                        }
    );

    this.seriesStatus_TERMynal  = new TERMynal_seriesStatus(
        "termynal_seriesStatus",
        this.DOMtermynal, 
        {
            "rows":     50,
            "scheme":   "dark",
            "page":     this
        }
    );

    this.pfdcm_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from pfdcm appears here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    this.PACSretrieve_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from PACS RETRIEVE status requests appear here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    this.PACSquery_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from PACS appears here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    this.seriesStatus_TERMynal.screenClear_setDefault(
        [
            '<span data-ty="input" data-ty-prompt="#">Output from series status appears here...</span>',
            '<span data-ty="input" data-ty-typeDelay="40" style="color: cyan;"data-ty-prompt="">...W A I T I N G...</span>'
        ]
    );

    // object that parses the URL
    this.url            = new URL(this.DOMurl);

    // object to allow a MSG object access to a DOM obj
    this.d_MSGtermynal   = {
        'element':  this.l_termynal,
        'dom':      this.DOMtermynal
    };

    $( "#helpInfo" ).dialog({
        autoOpen:       false,
        height:         520,
        width:          500,
        dialogClass:    'helpInfo-dialog'
    });
    
    $( "#help-opener" ).click(function() {
        $( "#helpInfo" ).dialog( "open" );
    });

    $( "#config_pfdcm" ).dialog({
        autoOpen:       false,
        height:         520,
        width:          800,
        dialogClass:    'config_pfdcm-dialog'
    });
    
    $( "#config_pfdcm-opener" ).click(function() {
        $( "#config_pfdcm" ).dialog( "open" );
    });

    $( "#config_PACS" ).dialog({
        autoOpen:       false,
        height:         220,
        width:          800,
        dialogClass:    'config_PACS-dialog'
    });
    
    $( "#config_PACS-opener" ).click(function() {
        $( "#config_PACS" ).dialog( "open" );
    });
}

Page.prototype = {
    constructor:    Page,

    FAinputButton_create:               function(astr_functionClickName, 
                                                 astr_value, 
                                                 astr_fname, 
                                                 astr_baseSet = "fa") {
        let str_inputButton     = `<input type="button"   onclick="` + astr_functionClickName + `"
                                    value=" &#x` + astr_value + ` " 
                                    style="padding: .1em .4em;" 
                                    class=" pure-button 
                                            pure-button-primary 
                                            ` + astr_baseSet + ` ` + astr_baseSet + '-' + astr_fname + `">
                                  `;
        return(str_inputButton);
    },

    rightArrow_inputButtonCreate:       function() {
        return(this.FAinputButton_create("page.rightArrow_process()", 
                                         "f35a", "arrow-alt-circle-right"));
    },

    rightArrow_process:                 function() {
        let str_help = `

            Process a right arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the next study in the returned QUERY.

        `;

        index = this.PACSquery_TERMynal.currentStudyIndex+1;
        if(index >= this.PACSquery_TERMynal.totalNumberOfStudies)
            index = 0;

        this.PACSquery_TERMynal.response_print(index);
    },

    leftArrow_inputButtonCreate:        function() {
        return(this.FAinputButton_create("page.leftArrow_process()",
                                         "f359", "arrow-alt-circle-left"));
    },

    leftArrow_process:                  function() {
        let str_help = `

            Process a left arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the previous study in the returned QUERY.

        `;

        index = this.PACSquery_TERMynal.currentStudyIndex-1;
        if(index < 0)
            index = this.PACSquery_TERMynal.totalNumberOfStudies-1;

        this.PACSquery_TERMynal.response_print(index);
    },

    upArrow_inputButtonCreate:          function() {
        return(this.FAinputButton_create("page.upArrow_process()",
                                         "f35b", "arrow-alt-circle-up"));
    },

    upArrow_process:                    function() {
        let str_help = `

            Process an up arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the first study in the returned QUERY.

        `;

        index = 0;
        this.PACSquery_TERMynal.response_print(index);
    },

    downArrow_inputButtonCreate:        function() {
        return(this.FAinputButton_create("page.downArrow_process()",
                                         "f358", "arrow-alt-circle-down"));
    },

    downArrow_process:                  function() {
        let str_help = `

            Process a down arrow event -- this should,
            if a PACS QUERY has been performed, advance
            to the very last study in the returned QUERY.

        `;

        index = this.PACSquery_TERMynal.totalNumberOfStudies-1;
        this.PACSquery_TERMynal.response_print(index);
    },

    checkForArrowKeyPress:          function(e) {
        let str_help = `

            The 'this' seems confused at this point. My guess is that
            since the event is defined on the "document" the 'this' 
            retains that identify when executing here. 

            Hence, we call the 'page' variable explicitly when resolving
            scope.

        `;

        e = e || window.event;

        if (e.keyCode == '38') {
            // up arrow
            console.log('up arrow')
            page.upArrow_process();
        }
        else if (e.keyCode == '40') {
            // down arrow
            console.log('down arrow')
            page.downArrow_process();
        }
        else if (e.keyCode == '37') {
           // left arrow
           console.log('left arrow')
            page.leftArrow_process();
        }
        else if (e.keyCode == '39') {
           // right arrow
           console.log('right arrow')
            page.rightArrow_process();
        }
    },

    anonDataMask_typeSet:               function(typeSpec) {
        const str_help  = `
            Set the type of various text input boxen in the main page
            as either "password" or "text"

        `;

        const DOMANON               = new DOM(this.l_PACSQRanon);

        for(DOMel of DOMANON.elements()) {
            DOMANON.type_set(DOMel, typeSpec)
        }
    },

    anonDataMask_toggle:                function() {
        let debug           = new Debug("Page.anonDataMask_toggle");
        debug.entering();
        let ANON_dataButton_DOM = document.getElementById("ANON_status");
        debug.vlog({
                        message:    'before toggle: b_anonDataMask', 
                        var:        this.b_anonDataMask
                    });
        this.b_anonDataMask = !this.b_anonDataMask;

        debug.vlog({
                        message:    'after  toggle: b_anonDataMask', 
                        var:        this.b_anonDataMask
                    });
        if(this.b_anonDataMask) {
            ANON_dataButton_DOM.innerHTML     = 'ANON mask: ON';
            ANON_dataButton_DOM.className     = 'pure-button pure-button-primary button-jsonHighlight-on';
            this.anonDataMask_typeSet('password');            
        }
        if(!this.b_anonDataMask) {
            ANON_dataButton_DOM.innerHTML     = 'ANON mask: OFF';
            ANON_dataButton_DOM.className     = 'pure-button pure-button-primary button-jsonHighlight-off';
            this.anonDataMask_typeSet('text');            
        }
        debug.leaving();
    },

    jsonSyntaxHightlight_toggle:    function() {
        let debug           = new Debug("Page.jsonSyntaxHighlight_toggle");
        debug.entering();
        let JSON_syntaxButton_DOM = document.getElementById("JSON_status");
        debug.vlog({message: 'before toggle: b_jsonSyntaxHighlight', var: this.b_jsonSyntaxHighlight});
        this.b_jsonSyntaxHighlight = !this.b_jsonSyntaxHighlight;
        debug.vlog({message: 'after  toggle: b_jsonSyntaxHighlight', var: this.b_jsonSyntaxHighlight});
        if(this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: ON';
            JSON_syntaxButton_DOM.className     = 'pure-button pure-button-primary button-jsonHighlight-on';
        }
        if(!this.b_jsonSyntaxHighlight) {
            JSON_syntaxButton_DOM.innerHTML     = 'JSON syntax highlight: OFF';
            JSON_syntaxButton_DOM.className     = 'pure-button pure-button-primary button-orange';
        }
        debug.leaving();
    },
    
    fields_populateFromURL: function() {
        let str_help = `
            Populate various fields on the page from URL args
        `;
        this.url.parse();
    }
}

// ---------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------

// Page object
let page            = new Page();
functionCallDepth   = 0;

// communication object, which includes the page so that MSG results
// can be displayed.
let post            = new REST(
                        {
                            'page':         page,
                            'VERB':         'POST',
                            'type':         'text',
                            'scheme':       'http',
                            'path':         '/api/v1/cmd/',
                            'clientAPI':    'Fetch'
                        }
                    );


// The whole document
$body                       = $("body");

$(document).on({
    ajaxStart:  function() { $body.addClass("loading");  output(APIcall);  },
    ajaxStop:   function() { $body.removeClass("loading"); }
});

window.onload = function() {
    // Parse the URL and populate relevant elements on the page
    page.fields_populateFromURL();
};

