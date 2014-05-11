if (typeof(OlipOne) == 'undefined') {
	var OlipOne = {};
};

OlipOne = {

	BrowseAppPath: function() {
		var nsIFilePicker = Components.interfaces.nsIFilePicker;
		var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
		fp.init(window, null, nsIFilePicker.modeOpen);
		fp.appendFilters(nsIFilePicker.filterApps);
		fp.appendFilters(nsIFilePicker.filterAll);
		var rv = fp.show();
		if (rv == nsIFilePicker.returnOK) {
			this.modifyTextBoxValue("olip-extapplocation", fp.file.target);
		} else
		{
			alert("Failed to select external app :" + rv);
		}
	},
	
	modifyTextBoxValue: function(textboxId, newValue) {
		var box = document.getElementById(textboxId);
		if (box.value != newValue) 
		{
			box.value = newValue;
		}
	}
} ;
