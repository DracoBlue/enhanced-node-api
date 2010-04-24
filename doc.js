var ManPageFilter = function () {
    this.man_content_container = $('#man-content');
    this.filter_box_relative = $('#toctitle');
};

ManPageFilter.prototype.initialize = function() {
    this.initializeData();

    this.rest();

    this.setupUnofficialNotice();
}

/**
 * This function collects all information we now about the structure and
 * contents of the man page. It also initializes the search index.
 */
ManPageFilter.prototype.initializeData = function() {
}

/**
 * Show the information, that this is not the official source of the nodejs api,
 * but an enhanced viewer.
 */
ManPageFilter.prototype.setupUnofficialNotice = function() {
    var relative_element = $('h1');
    var info_box_html = [
        '<div style="padding: 10px;">This is not the official location of the ', $('#toctitle').text(),
        ' API <a href="http://nodejs.org/api.html">nodejs.org/api.html</a>, but an enhanced viewer.',
        ' Created by <a href="http://dracoblue.net">DracoBlue</a>, 2010.</div>'
    ].join('');

    $('h1').after($(info_box_html));
}

ManPageFilter.prototype.rest = function() {
    var self = this;

    /*
     * Idea:
     * 
     * The markup is something like this: <h2>Section 1</h2> <p>Text</p>
     * <h3>SubSection 1.1</h3> <pre> <code>...</code> </pre> <h2>Section 2</h2>
     * 
     * So the sections are just grouped in order of occurrence.
     * 
     * To make the filtering faster (then looping through the dom every time),
     * we'll store all elements and their contents in a simple map and iterate
     * over this one then.
     */

    /**
     * All children in the #man-element.
     */
    var elements = this.man_content_container.children();

    /**
     * We'll store the length for performance reasons.
     */
    var elements_length = elements.length;

    /**
     * The current level (0 is root, 1 is lowest and so on)
     */
    var level = 0;

    /**
     * The next level (what our new header element has)
     */
    var new_level = 0;

    /**
     * The tag name of the current element
     */
    var tag_name = null;

    /**
     * The current element
     */
    var element = null;

    /**
     * The new navigation element, we create for the current element.
     */
    var new_navigation_element = null;

    /**
     * A small helper map, we'll use to check wether a tag is a header or not.
     */
    var is_header_tag = {
        "h2": true,
        "h3": true,
        "h4": true
    };

    /**
     * The current's element parent navigation node.
     */
    var parent_navigation_node = null;

    /**
     * The +/- button to toggle the parent's open/closed state.
     */
    var open_parent_node = null;

    /*
     * To know which (navigation/dom) items to hide, when a specific filter is
     * applied, we'll store some extra information while we are working through
     * the nodes.
     * 
     * Those are suffixed with stack. The first element [0] is always the root
     * node.
     * 
     * The stack is like a breadcrumb for the current element.
     */

    /**
     * Stack contains the dom_element for the parent, which holds all children
     */
    var navigation_stack = [];
    navigation_stack.push($('<ul />')[0]);

    /**
     * Stack contains the search-text for the parents.
     */
    var navigation_text_stack = [
        ''
    ];

    /**
     * Stack contains the position in the elements-variable for each parent.
     */
    var navigation_parent_stack = [
        0
    ];

    /**
     * A map which contains the search-texts for each element (is a array while
     * creation and finally a gets joined into a string).
     */
    var element_search_texts = {};

    /**
     * A map, which contains the navigation node, which is connected with an
     * element.
     */
    var element_navigation_node = {};

    /*
     * Let's fill all those maps with content now ...
     */

    for ( var i = 0; i < elements_length; i++) {
        element = elements[i];
        tag_name = element.tagName.toLowerCase();
        element = $(element);
        element_id = element.text().replace(/\(.*\)$/gi, "").replace(/[\s\.]+/gi, "-").toLowerCase() + "-" + i;
        element.attr('id', element_id);
        element_search_texts[i] = [];
        element_lowercase_text = element.text().toLowerCase();

        if (typeof is_header_tag[tag_name] !== 'undefined') {
            new_level = Number(tag_name.substr(1, 1)) - 1;

            if (new_level === level + 1) {
                // we reached just a new level!
                level++;
            } else if (new_level === level) {
                // we are at the same level :(
                navigation_stack = navigation_stack.splice(0, new_level);
                navigation_text_stack = navigation_text_stack.splice(0, new_level);
                navigation_parent_stack = navigation_parent_stack.splice(0, new_level);
            }

            if (new_level < level) {
                /*
                 * Let's increase the depth!
                 */
                navigation_stack = navigation_stack.splice(0, new_level);
                navigation_text_stack = navigation_text_stack.splice(0, new_level);
                navigation_parent_stack = navigation_parent_stack.splice(0, new_level);
                level = new_level;
            }

            if (new_level === level) {

                new_navigation_element = $('<li />');
                new_navigation_element.addClass('topLevel');

                new_navigaton_element_link = $('<a href="#' + element_id + '" />');
                new_navigaton_element_link.css('pointer', 'cursor');
                new_navigaton_element_link.text(element.text().replace(/\(.*\)$/gi, ""));

                (function(element) {
                    new_navigaton_element_link.click(function(event) {
                        /*
                         * It's unknown, because invisible? Let's go to top!
                         */
                        if (element.css('display') === 'none') {
                            $('#man').animate( {
                                scrollTop: 0
                            }, 500);
                        } else {
                            var targetOffset = element.offset().top;
                            $('#man').animate( {
                                scrollTop: targetOffset
                            }, 500);
                        }
                        event.preventDefault();
                        return true;
                    });
                }($(element)));

                new_navigation_element.append(new_navigaton_element_link);

                /*
                 * Ok, we don't have that <ul> for the children, yet.
                 */
                if (navigation_stack[level - 1] === true) {
                    navigation_stack[level - 1] = $('<ul style="display: none" />')[0];
                    parent_navigation_node = $(element_navigation_node[navigation_parent_stack[level - 1]]);
                    open_parent_node = $('<a href="#" class="toggler">+</a>');
                    (function(ul_to_toggle, open_parent_node) {
                        open_parent_node.click(function(event) {
                            var is_open = ul_to_toggle.css('display') === 'none' ? false : true;

                            if (is_open) {
                                open_parent_node.text('+');
                                ul_to_toggle.slideUp();
                            } else {
                                open_parent_node.text('-');
                                ul_to_toggle.slideDown();
                            }
                            event.preventDefault();
                            return false;
                        });
                    }($(navigation_stack[level - 1]), $(open_parent_node)));
                    parent_navigation_node.prepend(open_parent_node);
                    parent_navigation_node.append(navigation_stack[level - 1]);

                    parent_navigation_node.removeClass('topLevel');
                }
                $(navigation_stack[level - 1]).append(new_navigation_element);

                /*
                 * We'll put true on the stack, and in case we add children,
                 * we'll check for that
                 */
                navigation_stack.push(true);

                navigation_text_stack.push(element_lowercase_text);
                navigation_parent_stack.push(i);

                element_search_texts[i].push(navigation_text_stack.join(' '));

                element_navigation_node[i] = new_navigation_element[0];
            }
        } else {
            element_navigation_node[i] = false;
        }
        // great, "just" content!
        var navigation_parent_stack_length = navigation_parent_stack.length;
        for ( var p = 1; p < navigation_parent_stack_length; p++) {
            element_search_texts[navigation_parent_stack[p]].push(element_lowercase_text);
        }
        element_search_texts[i].push(element_lowercase_text);
        element_search_texts[i].push(element_search_texts[navigation_parent_stack[navigation_parent_stack_length - 1]][0]);
    }

    /*
     * Now we have to join the element_search_texts.
     */
    for ( var i = 0; i < elements_length; i++) {
        element_search_texts[i] = element_search_texts[i].join(' ');
    }

    var search_field = $('<input style="width: 160px; margin-bottom: 10px;" />');
    var search_result_info = $('<div style="display: none; background-color: #121314; padding: 10px;"></div>');
    var previous_text = "";

    var checkForSearchChangeHandler = function(event) {
        var text = search_field.val().toLowerCase();
        if (previous_text === text) {
            return;
        }

        previous_text = text;

        var u = new Date();

        self.man_content_container.css('visibility', 'hidden');

        var elements_found = 0;

        if (text === '') {
            for ( var i = 0; i < elements_length; i++) {
                element = elements[i];
                element.style.display = '';
                if (element_navigation_node[i] !== false) {
                    element_navigation_node[i].style.display = '';
                }
            }
            elements_found = elements_length;
        } else {
            for ( var i = 0; i < elements_length; i++) {
                element = elements[i];
                if (element_search_texts[i].indexOf(text) === -1) {
                    element.style.display = 'none';
                    if (element_navigation_node[i] !== false) {
                        element_navigation_node[i].style.display = 'none';
                    }
                } else {
                    element.style.display = '';
                    elements_found++;
                    if (element_navigation_node[i] !== false) {
                        element_navigation_node[i].style.display = '';
                    }
                }
            }
        }

        if (elements_found === elements_length) {
            search_result_info.slideUp();
        } else {
            search_result_info.text('Filtered Results: Hiding ' + Math.floor(10000 - elements_found * 10000 / elements_length) / 100
                    + '% (took ' + ((new Date()).getTime() - u.getTime()) + 'ms)');
            search_result_info.slideDown();
        }

        self.man_content_container.css('visibility', '');
    };

    var check_for_search_change_handler_timer = null;

    var delayedCheckForSearchChangeHandler = function() {
        if (check_for_search_change_handler_timer) {
            clearTimeout(check_for_search_change_handler_timer);
        }
        check_for_search_change_handler_timer = setTimeout(checkForSearchChangeHandler, 200);
    };

    search_field.keyup(delayedCheckForSearchChangeHandler).change(delayedCheckForSearchChangeHandler);

    this.filter_box_relative.after(navigation_stack[0]);
    this.filter_box_relative.after(search_field);
    this.filter_box_relative.after($('<div style="font-size: 70%">Filter:</div>'));

    $('h1').after($('<div style="padding: 10px;></div>"').append(search_result_info));
};

(new ManPageFilter()).initialize();