/*
Script: OTRAUsable.class.js
	Extends: OTRAItem

Author:
	Olivier Gasc, <gasc.olivier@gmail.com>

License:
	MIT-style license.

Class: OTRAUsable

Arguments:
	id:		id of the object
	data:	properties of the object
*/

var OTRAUsable = new Class({
	Extends: OTRAItem,

    /**
	 * Initialisation
	 *
	 **/
	initialize: function(id, data)
    {
		this.parent(id, data);
    }
});