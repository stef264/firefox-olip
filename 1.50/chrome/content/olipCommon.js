if (typeof(olipCommon) == 'undefined') {
	var olipCommon = {};
};

var olipCommon =
        {
            prefs: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService)
                                    .getBranch("extensions.olip.").QueryInterface(Components.interfaces.nsIPrefBranch2),            
                    
            /* Show Settings Option To User */
            ShowSettings: function ()
            {               
               var features = 'chrome,titlebar,toolbar,centerscreen,';
               window.openDialog('chrome://olip/content/olipSettings.xul', 'Olip Settings', features);
            },
                   
            /*
                Start external application 
            */
            StartExternalApp: function ()
            {   
                // alert("Start External Application");
                
                var url = olipCommon.getCurrentUrl();
                
                // alert("url is [" + url + "]");
                
                if ( null != url ) 
                {
                    var currentUrl = null;
                    if ( olipCommon.prefs.getBoolPref("workWithFullURL") )
                    {
                        currentUrl = url;    
                    } else
                    {       
                        var baseAddressWithOptionalPort = url;                     
                        var checkForPortMatchingRegEx = /(.*):(\d+)/ ; 
                        var _url = ""; 
                        var division = checkForPortMatchingRegEx.exec(baseAddressWithOptionalPort) ;                             
                        if ( null != division) 
                        {
                                var baseAdd = division[1]; 
                                var port = division[2] ;
                                _url = baseAdd;    
                        } else 
                        {
                                _url = baseAddressWithOptionalPort ;
                        }
                        currentUrl = _url;
                    }
                    olipCommon.OpenLinkInProgram(currentUrl) ; 
                    return true;
                } else
                {
                    olipCommon.ShowFFNotification("Does not qualify as valid url...") ; 
                    return false; 
                } 
            },
        
            getCurrentUrl: function()
            {
                var currentTabUrl = gBrowser.currentURI.spec;
                //alert("What is current tab url " + currentTabUrl + " shall i return full url " + olipCommon.prefs.getBoolPref("workWithFullURL"));
                
                if (! olipCommon.prefs.getBoolPref("workWithFullURL"))
                {
                    currentTabUrl = olipCommon.getFilteredCurrentTabUrl(currentTabUrl);
                }
                //alert("returning ... [" + currentTabUrl + "]");
                return currentTabUrl;
            },
            
            /*
               Copy current link to clipboard but copy till the domain part, Dont copy options given after the main URL.
               E.g. if user is on http://www.helpme.com/topic=life then below fucntion will only copy "www.helpme.com" 
            */
            CopyLinkToClipboard: function()
            {
                var currentTabUrl = gBrowser.currentURI.spec;
                var url = olipCommon.getFilteredCurrentTabUrl(currentTabUrl) ;
                if ( null != url ) 
                {                  
                    const gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper) ;
                    gClipboardHelper.copyString(url);
                } else
                {
                    olipCommon.ShowFFNotification("OLIP Error : Link could not be copied to clipboard!") ; 
                }
                
                return true; 
            },
            
            /*
                Actually launch the application on user`s machine! It tries to catch the error using try .. catch block.
            */      
            OpenLinkInProgram: function(url)
            {            
                var process = Components.classes["@mozilla.org/process/util;1"]
                                .createInstance(Components.interfaces.nsIProcess);
        
                var file = Components.classes["@mozilla.org/file/local;1"]
                                .createInstance(Components.interfaces.nsILocalFile);
    
                var extApp = olipCommon.GetExternalAppFromPrefs();
                
                //alert("going to open [" + url + "] in olipCommon app [" + extApp + "]");
                file.initWithPath(extApp);
                try
                {
                        //alert("Ext app " + extApp);
                        process.init(file) ; 
                } catch (err)
                {
                        olipCommon.ShowAppLaunchErrorMessage(err);
                        return true;
                }
                var args = ["load", url];
                
                try
                {
                    process.runAsync(args, args.length);
                } catch (err)
                {       
                    olipCommon.ShowAppLaunchErrorMessage(err);
                }
                return true ; 
            },
            
            /* Display error message if external file being configured to launch does not exist! */
            ShowAppLaunchErrorMessage: function(err)
            {
                    var errMsg = "Please check if external application exist!!\n\n" ; 
                    errMsg += "Error Description :" + err.message + "\n\n" ;
                    olipCommon.ShowPopupMessage(errMsg) ; 
            },
            
            /* Show regular alert message */
            ShowPopupMessage: function(msg)
            {
                alert(msg);
                return true ;
            },
            
            /* 
               Show Firefox pop-up blocked message 
               TODO: User  should be able to select which kind of message user would like to see! alert or pop-up blocker
            */
            ShowFFNotification: function(msg)
            {
                var nb = gBrowser.getNotificationBox();
                var n = nb.getNotificationWithValue('popup-blocked');
                if(n) 
                {
                        n.label = msg;
                } else 
                {
                        var buttons = [{
                                label: 'Ok',
                                accessKey: 'B',
                                popup: 'blockedPopupOptions',
                                callback: null
                        }];
        
                        const priority = nb.PRIORITY_WARNING_LOW;
                        nb.appendNotification(msg, 'popup-blocked',
                        'chrome://browser/skin/Info.png',
                        priority, buttons);
                }
            },
               
            /*
                Parse the URL to get till domain part only. Ignore all other options
                    TODO: Modify reg-ex, so that user can specify their own reg-ex
                    TODO: Only limited to http(s) add (s)ftp as well
            */
            getFilteredCurrentTabUrl: function(url)
            {
                var currentURL = url;
               
                if ( olipCommon.prefs.getBoolPref("workWithFullURL") )
                {
                    alert("Inside Return Full URL");
                    return currentURL;                        
                }                                
                var urlRegEx = /^htt(p|ps):\/\/(.*?)\//;
                //alert("[" + olipCommon.prefs.getCharPref("olipURLFilter") + " ]apply it on : [" + currentURL + "]");
                var result = url.match(urlRegEx);
                return result[2];
            },
            
            GotoHomePage: function()
            {
                var homePageUrl = "https://code.google.com/p/olip/";
                gBrowser.selectedTab = gBrowser.addTab(homePageUrl);
            },
            
            /*
                Settings menu, used to select the executable on users machine
            */
            GetExternalAppFromPrefs: function()
            {                    
                    var extAppLocation = olipCommon.prefs.getCharPref("location");
                    var noAppMsg = "Please Select External Application..." ;
                    var validExts = /.*\.(exe|bat|vbe|cmd|sh|ksh|pl|py|rb)$/ ;
                    if ( extAppLocation.match(noAppMsg) )
                    {
                        var errMsg = "OLIP Ext: External Application Not Selected! Please set it first : Tools -> Olip Menu -> Options -> General -> External Application"; 
                        olipCommon.ShowFFNotification(errMsg);
                        return false;
                    } else 
                    {
                        return extAppLocation ; 
                    }
            }       
}