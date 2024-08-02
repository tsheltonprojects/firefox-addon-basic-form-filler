"use strict";

var addon_form_fill = (function(){

	var convertFormToObject =  function( form ){
		try {
			var data = new FormData( form );
			var obj = {};
			var keys = data.keys();

			while ( true ) {
				var key = keys.next();
				if ( key.done == true ) break;

				key = key.value;
				obj[ key ] = data.get( key );
			}
			return obj;
		} catch (e) {
			alert( e + " " + e.lineNumber );
		}
	};


	var forms = document.querySelectorAll( "form" );

	var n = forms.length;
	var all_forms = {};

	var number_of_fields_saved = 0;
	for ( var i = 0; i < n; i++ ) {
		var form = forms[ i ];
		var obj = convertFormToObject( form );
		var number_of_fields_saved = number_of_fields_saved + Object.keys( obj ).length;
		var string = JSON.stringify( obj );
		console.log( string );
		all_forms[ i ] = string;
	}

	var string = JSON.stringify( all_forms );
	var url = location.toString().split("#")[0];

	var data = {
		command: "set",
		data: string,
		url: url,
	};
	myPort.postMessage( JSON.stringify( data ) );

	if ( number_of_fields_saved == 0 ) {
		alert("No fields found on the page");
	}

});

var addon_form_restore = function( data ) {
	var url = location.toString().split("#")[0];

	if ( typeof data == "undefined" ) {
		var data = {
			command: "get",
			url: url,
		};
		myPort.postMessage( JSON.stringify( data ) );
		return;
	} else {

		try{

			var forms_i = 0;
			var forms_n = document.forms.length;


			while ( forms_i < forms_n ) {
				var form = document.forms[ forms_i ];
				var form_data = JSON.parse( data[ forms_i ] );

				for ( var key in form_data ) {
					var e = form.querySelector("*[name=\"" + key + "\"]");
					console.log( "*[name=\"" + key + "\"]", e );
					if ( e == null ) continue;

					if ( e.nodeName == "INPUT" ) {
						var type = e.getAttribute("type");

						if ( type == null ) {
							type = "text";
						} else {
							type = type.toLowerCase();
						}

						var value = e.getAttribute("value");
						switch ( type ) {
							case "hidden":
								//skip hidden
								break;
							case "radio":
								var e2 = form.querySelector("*[name=\"" + key + "\"][value='"+value+"']");
								if ( e2 ) {
									e2.checked = true;
								}
							break;
							case "checkbox":
								var e2 = form.querySelector("*[name=\"" + key + "\"][value='"+value+"']");
								if ( e2 ) {
									e2.checked = true;
								}
							break;
							case "file":
							break;
							default:
								e.value = form_data[ key ];
							break;
						}
					}  else if ( e.nodeName == "TEXTAREA" ) {
						e.value = form_data[ key ];
					} else if ( e.nodeName == "SELECT" ) {
						var options = e.querySelectorAll("option");
						var n = options.length;

						for ( var i = 0; i < n; i++ ) {
							var option = options[ i ];



							if ( option.value == form_data[key] ) {
								option.selected = 'selected';
								break;
							}
						}
					} else {
						console.log( "unknown node: " + e.nodeName );
					}


				}

				forms_i += 1;
			}
		} catch (e) {
				alert( e + " " + e.lineNumber );
		}
	}
}

var myPort = browser.runtime.connect({name:"port-from-form-filler"});

myPort.onMessage.addListener(function(m) {

	if ( m.command == "form-fill-save" ) {
		if ( confirm( "Save form fill data?" ) ) {
			addon_form_fill();
		}
	} else  if ( m.command == "form-fill-restore" ) {
		addon_form_restore();
	} else {

		if ( m != "failed" ) {
			var data = JSON.parse( JSON.parse( m ) );
			addon_form_restore( data );
		}
	}
})

