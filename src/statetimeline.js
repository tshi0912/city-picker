(function($) {
    'use strict';

    $.fn.navigationWizard = function(options) {
        var defaults = {
                stepMinDistance: 100,
                stepClickHandler: undefined
            },
            settings = $.extend({}, defaults, options),
            navbarContainer = this,
            navComponent = {};


        var navbarTemplate = $(['<div class="timeline">',
            '<div class="events-wrapper">',
            '<div class="events">',
            '<ol>',
            getSteps(options),
            '</ol>',
            '<span class="filling-line" aria-hidden="true"></span>',
            '</div>',
            '</div>',
            '<ul class="cd-timeline-navigation">',
            '<li><a href="#0" class="prev inactive">Prev</a></li>',
            '<li><a href="#0" class="next">Next</a></li>',
            '</ul>',
            '</div>'
        ].join(''));

        navbarContainer.addClass('cd-horizontal-timeline').append(navbarTemplate);

        //cache timeline components
        navComponent['config'] = settings;
        navComponent['timelineWrapper'] = navbarContainer.find('.events-wrapper');
        navComponent['eventsWrapper'] = navComponent['timelineWrapper'].children('.events');
        navComponent['fillingLine'] = navComponent['eventsWrapper'].children('.filling-line');
        navComponent['timelineEvents'] = navComponent['eventsWrapper'].find('a');
        navComponent['timelineNavigation'] = navbarContainer.find('.cd-timeline-navigation');

        var eventsCount = navComponent['timelineEvents'] && navComponent['timelineEvents'].length;
        //set max-width of the .timeline
        if ((eventsCount + 2) * settings.stepMinDistance < 800) {
            navComponent['timelineWrapper'].parent('.timeline').css('max-width', (eventsCount + 2) * settings.stepMinDistance)
        }
        //assign a left postion to the single events along the timeline
        setStepPosition(navComponent, settings.stepMinDistance);
        //assign a width to the timeline
        var timelineTotWidth = setTimelineWidth(navComponent, settings.stepMinDistance);
        //the timeline has been initialize - show it
        navbarContainer.addClass('loaded');

        //detect click on the next arrow
        navComponent['timelineNavigation'].on('click', '.next', function(event) {
            event.preventDefault();
            updateSlide(navComponent, timelineTotWidth, 'next');
        });
        //detect click on the prev arrow
        navComponent['timelineNavigation'].on('click', '.prev', function(event) {
            event.preventDefault();
            updateSlide(navComponent, timelineTotWidth, 'prev');
        });
        //detect click on the a single event - show new event content
        navComponent['eventsWrapper'].on('click', 'a', function(event) {
            event.preventDefault();
            navComponent['timelineEvents'].removeClass('active');
            $(this).addClass('active');
            updateOlderEvents($(this));
            updateFilling($(this), navComponent['fillingLine'], timelineTotWidth);
            options.stepClickHandler ? options.stepClickHandler.call(this, navComponent) : void 0;
        });

        //keyboard navigation
        $(document).keyup(function(event) {
            if (event.which == '37' && elementInViewport(navbarContainer.get(0))) {
                showNewNavLi(navComponent, timelineTotWidth, 'prev');
            } else if (event.which == '39' && elementInViewport(navbarContainer.get(0))) {
                showNewNavLi(navComponent, timelineTotWidth, 'next');
            }
        });
        $(document).off("resize.cd-horizontal-timeline").on("resize.cd-horizontal-timeline", function(event) {
            navComponent['timelineNavigation'].find('.next').click();
            navComponent['timelineNavigation'].find('.prev').click();
        });

        return {
            setActiveNavItem: setActiveNavItem,
            navComponent: navComponent
        };

        function getSteps(options) {
            var steps = '';

            $.each(options.steps, function(index, item) {
                steps += ['<li>',
                    '<a href="#nav' + (index + 1) + '" data-index="' + (index + 1) + '" class="' + (index != 0 || "active") + '">' + item.title + '</span> </a>',
                    '</li>'
                ].join('');
            });

            return steps;
        }

        function setActiveNavItem(index, toggle) {
            var targetElm = $(this.navComponent['timelineEvents'].get(index - 1));
            toggle ? targetElm.removeClass('complete') : targetElm.addClass('complete');
        }

        function updateSlide(navComponent, timelineTotWidth, string) {
            //retrieve translateX value of navComponent['eventsWrapper']
            var translateValue = getTranslateValue(navComponent['eventsWrapper']),
                wrapperWidth = Number(navComponent['timelineWrapper'].css('width').replace('px', ''));
            //translate the timeline to the left('next')/right('prev')
            (string == 'next') ? translateTimeline(navComponent, translateValue - wrapperWidth + settings.stepMinDistance, wrapperWidth - timelineTotWidth): translateTimeline(navComponent, translateValue + wrapperWidth - settings.stepMinDistance);
        }

        function showNewNavLi(navComponent, timelineTotWidth, string) {
            //go from one event to the next/previous one
            var selectedStep = navComponent['eventsWrapper'].find('.active'),
                selectedStepLi = selectedStep.parent('li'),
                newContent = (string == 'next') ? selectedStepLi.next() : selectedStepLi.prev();

            if (newContent.length > 0) { //if there's a next/prev event - show it
                var newEvent = (string == 'next') ? selectedStepLi.next('li').children('a') : selectedStepLi.prev('li').children('a');
                updateFilling(newEvent, navComponent['fillingLine'], timelineTotWidth);
                //updateVisibleContent(newEvent, navComponent['eventsContent']);
                newEvent.addClass('active');
                selectedStep.removeClass('active');
                updateOlderEvents(newEvent);
                updateTimelinePosition(string, newEvent, navComponent);

                options.stepClickHandler ? options.stepClickHandler.call(newEvent, navComponent) : void 0;
            }
        }

        function updateTimelinePosition(string, event, navComponent) {
            //translate timeline to the left/right according to the position of the selected event
            var eventStyle = window.getComputedStyle(event.get(0), null),
                eventLeft = Number(eventStyle.getPropertyValue("left").replace('px', '')),
                timelineWidth = Number(navComponent['timelineWrapper'].css('width').replace('px', '')),
                timelineTotWidth = Number(navComponent['eventsWrapper'].css('width').replace('px', ''));
            var timelineTranslate = getTranslateValue(navComponent['eventsWrapper']);

            if ((string == 'next' && eventLeft > timelineWidth - timelineTranslate) || (string == 'prev' && eventLeft < -timelineTranslate)) {
                translateTimeline(navComponent, -eventLeft + timelineWidth / 2, timelineWidth - timelineTotWidth);
            }
        }

        function translateTimeline(navComponent, value, totWidth) {
            var eventsWrapper = navComponent['eventsWrapper'].get(0);
            value = (value > 0) ? 0 : value; //only negative translate value
            value = (!(typeof totWidth === 'undefined') && value < totWidth) ? totWidth : value; //do not translate more than timeline width
            setTransformValue(eventsWrapper, 'translateX', value + 'px');
            //update navigation arrows visibility
            (value == 0) ? navComponent['timelineNavigation'].find('.prev').addClass('inactive'): navComponent['timelineNavigation'].find('.prev').removeClass('inactive');
            (value == totWidth) ? navComponent['timelineNavigation'].find('.next').addClass('inactive'): navComponent['timelineNavigation'].find('.next').removeClass('inactive');
        }

        function updateFilling(selectedEvent, filling, totWidth) {
            //change .filling-line length according to the selected event
            var eventStyle = window.getComputedStyle(selectedEvent.get(0), null),
                eventLeft = eventStyle.getPropertyValue("left"),
                eventWidth = eventStyle.getPropertyValue("width");
            eventLeft = Number(eventLeft.replace('px', '')) + Number(eventWidth.replace('px', '')) / 2;
            var scaleValue = eventLeft / totWidth;
            setTransformValue(filling.get(0), 'scaleX', scaleValue);
        }

        function setStepPosition(navComponent, min) {
            for (var i = 0; i < navComponent['timelineEvents'].length; i++) {
                var distanceNorm = i + 1;
                navComponent['timelineEvents'].eq(i).css('left', distanceNorm * min + 'px');
            }
        }

        function setTimelineWidth(navComponent, width) {
            var timeSpanNorm = navComponent['timelineEvents'].length + 1.2,
                totalWidth = timeSpanNorm * width;
            navComponent['eventsWrapper'].css('width', totalWidth + 'px');
            updateFilling(navComponent['eventsWrapper'].find('a.active'), navComponent['fillingLine'], totalWidth);
            updateTimelinePosition('next', navComponent['eventsWrapper'].find('a.active'), navComponent);

            return totalWidth;
        }

        function updateOlderEvents(event) {
            event.parent('li').prevAll('li').children('a').addClass('older-event').end().end().nextAll('li').children('a').removeClass('older-event');
        }

        function getTranslateValue(timeline) {
            var timelineStyle = window.getComputedStyle(timeline.get(0), null),
                timelineTranslate = timelineStyle.getPropertyValue("-webkit-transform") ||
                timelineStyle.getPropertyValue("-moz-transform") ||
                timelineStyle.getPropertyValue("-ms-transform") ||
                timelineStyle.getPropertyValue("-o-transform") ||
                timelineStyle.getPropertyValue("transform"),
                translateValue = 0;

            if (timelineTranslate.indexOf('(') >= 0) {
                timelineTranslate = timelineTranslate.split('(')[1];
                timelineTranslate = timelineTranslate.split(')')[0];
                timelineTranslate = timelineTranslate.split(',');
                translateValue = timelineTranslate[4];
            }
            return Number(translateValue);
        }

        function setTransformValue(element, property, value) {
            element.style["-webkit-transform"] = property + "(" + value + ")";
            element.style["-moz-transform"] = property + "(" + value + ")";
            element.style["-ms-transform"] = property + "(" + value + ")";
            element.style["-o-transform"] = property + "(" + value + ")";
            element.style["transform"] = property + "(" + value + ")";
        }

        /*
            How to tell if a DOM element is visible in the current viewport?
            http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
        */
        function elementInViewport(el) {
            var top = el.offsetTop;
            var left = el.offsetLeft;
            var width = el.offsetWidth;
            var height = el.offsetHeight;

            while (el.offsetParent) {
                el = el.offsetParent;
                top += el.offsetTop;
                left += el.offsetLeft;
            }

            return (
                top < (window.pageYOffset + window.innerHeight) &&
                left < (window.pageXOffset + window.innerWidth) &&
                (top + height) > window.pageYOffset &&
                (left + width) > window.pageXOffset
            );
        }

        function checkMQ() {
            //check if mobile or desktop device
            return window.getComputedStyle(document.querySelector('.cd-horizontal-timeline'), '::before').getPropertyValue('content').replace(/'/g, "").replace(/"/g, "");
        }
    };
}(jQuery));

var options = {
  steps: [{
    title: "派车"
  }, {
    title: "接单"
  }, {
    title: "发车"
  }, {
    title: "在途"
  }, {
    title: "到达"
  }
  , {
    title: "卸货"
  }
  , {
    title: "回单确认"
  }]
};
var navbar = $('#cd-horizontal-timeline').navigationWizard(options);
navbar.setActiveNavItem(4)
