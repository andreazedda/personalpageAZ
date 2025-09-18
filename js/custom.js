jQuery(function($) {
    'use strict';

    var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    function applyMotionPreference(event) {
        var matches = event.matches !== undefined ? event.matches : event.currentTarget.matches;
        document.body.classList.toggle('reduce-motion', matches);
    }

    applyMotionPreference(reduceMotionQuery);
    if (typeof reduceMotionQuery.addEventListener === 'function') {
        reduceMotionQuery.addEventListener('change', applyMotionPreference);
    } else if (typeof reduceMotionQuery.addListener === 'function') {
        reduceMotionQuery.addListener(applyMotionPreference);
    }

    var $navToggle = $('.navbar-toggle');
    var $navBox = $('.nav-box');

    function closeNav() {
        if (!$navBox.length) {
            return;
        }
        $navToggle.attr('aria-expanded', 'false');
        $navBox.removeClass('is-open').attr('hidden', true);
    }

    function openNav() {
        if (!$navBox.length) {
            return;
        }
        $navToggle.attr('aria-expanded', 'true');
        $navBox.addClass('is-open').removeAttr('hidden');
    }

    if ($navBox.length) {
        $navBox.attr('hidden', true);
    }

    $navToggle.on('click', function() {
        var expanded = $(this).attr('aria-expanded') === 'true';
        if (expanded) {
            closeNav();
        } else {
            openNav();
        }
    });

    $('.navigation-menu > li > a').on('click', function() {
        if (window.innerWidth < 992) {
            closeNav();
        }
    });

    $('.next-section').on('click', function(event) {
        event.preventDefault();
        var $currentSection = $(this).closest('.section');
        var $nextSection = $currentSection.next('.section');
        if ($nextSection.length) {
            var behavior = reduceMotionQuery.matches ? 'auto' : 'smooth';
            $nextSection[0].scrollIntoView({ behavior: behavior, block: 'start' });
        }
    });

    function syncNavVisibility() {
        if (!$navBox.length) {
            return;
        }
        if (window.innerWidth >= 992) {
            $navBox.addClass('is-open').removeAttr('hidden');
            $navToggle.attr('aria-expanded', 'true');
        } else if (!$navBox.hasClass('is-open')) {
            $navBox.attr('hidden', true);
            $navToggle.attr('aria-expanded', 'false');
        }
    }

    syncNavVisibility();
    $(window).on('resize', syncNavVisibility);
});
