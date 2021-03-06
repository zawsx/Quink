/**
 * Quink, Copyright (c) 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * This file is part of Quink.
 * 
 * Quink is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Quink is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Quink.  If not, see <http://www.gnu.org/licenses/>.
 */

define([
    'jquery',
    'util/PubSub'
], function ($, PubSub) {
    'use strict';

    /**
     * Define a type to be used if the browser doesn't support DOM mutation observers.
     * This won't have the full functinoality of a mutation observer, but is possibly better
     * than nothing.
     * MutOb ignores any arguments passed to the observe function and doesn't pass back any
     * mutation records to the registered callback. It should monitor changes to the document
     * but doesn't provide any way to restrict the monitoring to a part of the document nor
     * does it provide a any way to identofy where the changes took place.
     * Better than nothing, but not as good as a DOM mutation observer.
     */
    var MutOb = function (callback) {
        this.callback = callback;
        this.subscriptions = [];
    };

    MutOb.prototype.onCmdExec = function (msg) {
        if (typeof msg === 'object') {
            this.onDocumentChange();
        }
    };

    MutOb.prototype.onDocumentChange = function () {
        this.callback(null);
    };

    /**
     * Ignores any target and option objects passed in.
     */
    MutOb.prototype.observe = function () {
        var onChange = this.onDocumentChange.bind(this),
            body = $('body');
        this.subscriptions.push(PubSub.subscribe('command.executed', this.onCmdExec.bind(this)));
        this.subscriptions.push(PubSub.subscribe('char.insert', onChange));
        this.subscriptions.push(PubSub.subscribe('plugin.saved', onChange));
        body.on('cut.quink paste.quink', onChange);
    };

    /**
     * Reverses the effect of observe.
     */
    MutOb.prototype.disconnect = function () {
        var body = $('body');
        this.subscriptions.forEach(function (sub) {
            PubSub.unsubscribe(sub);
        });
        body.off('cut.quink paste.quink');
    };

    /**
     * A no-op.
     */
    MutOb.prototype.takeRecords = function () {
        return null;
    };

    /**
     * A change monitor is a DOM mutation observer when the browser supports it. Otherwise
     * it's a less functional object that supports the same interface.
     */
    var ChangeMonitor = function (callback) {
        var Constructor = window.MutationObserver || window.WebKitMutationObserver || MutOb;
        if (typeof callback !== 'function') {
            throw new TypeError();
        }
        this.monitor = new Constructor(callback);
    };

    ChangeMonitor.prototype.observe = function (target, options) {
        this.monitor.observe(target, options);
    };

    ChangeMonitor.prototype.disconnect = function () {
        this.monitor.disconnect();
    };

    ChangeMonitor.prototype.takeRecords = function () {
        return this.monitor.takeRecords();
    };

    return ChangeMonitor;
});
