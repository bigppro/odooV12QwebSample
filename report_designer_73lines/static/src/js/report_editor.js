odoo.define('report_designer_73lines.report_editor', function (require) {
    'use strict';

    var core = require('web.core');
    var Dialog = require('web.Dialog');
    var ajax = require('web.ajax');
    var rpc = require('web.rpc');
    var wUtils = require('website.utils');
    var Editor = require('web_editor.editor');
    var snippet_editor = require('web_editor.snippet.editor');
    var options = require('web_editor.snippets.options');
    var qs_obj = $.deparam($.param.querystring());
    var Attributes = null;

    var _t = core._t;
    var QWeb = core.qweb;

    QWeb.add_template('/report_designer_73lines/static/src/xml/website_templates.xml');

    var dialog = Dialog.extend({
        init: function (parent, name) {
            var self = this;
            this.name = name;
            this.report_id = parent.report_id;
            this._super(parent, {
                title: _.str.sprintf(_t(this.name)),
                size: 'medium',
                buttons: [{
                    text: _t('Export'),
                    classes: 'btn-primary',
                    click: this.onExport,
                }, {
                    text: _t('Cancel'),
                    close: true,
                }],
            });
        },
        start: function () {
            var self = this;
            rpc.query({
                route: "/get/report-details",
                params: {
                    report_id: this.report_id
                }
            }).then(function (res) {
                if (res) {
                    self.$el.html(QWeb.render("ReportExportDialogContent", res));
                    self.$el.find("#modules").select2({val: res.modules});
                }
            });
        },
        onExport: function (e) {
            window.location = '/report/export/'+ this.report_id + this.getQueryString();
            this.close();
        },
        getQueryString: function () {
            var name = this.$el.find('#report-name').val() || "";
            var modules = this.$el.find('#modules').val() || [];
            var str = "?modules=" + modules + "&name=" + name;
            return str;
        }
    });

    var misc = {
        is_report_editor: function () {
            return (window.location.pathname).indexOf('/report/edit/') !== -1 ? true : false;
        },
        is_report_main_page: function () {
            return (window.location.pathname).indexOf('/report/editor') !== -1 ? true : false;
        }
    };

    var ReportEditor = core.Class.extend({
        init: function () {
            this.report_id = parseInt(qs_obj.report_id) !== NaN ? parseInt(qs_obj.report_id) : false;
            this.record_id = parseInt(qs_obj.record_id) !== NaN ? parseInt(qs_obj.record_id) : false;
            this.debug = ("" + qs_obj.debug).toString().trim() !== '' ? qs_obj.debug : '';
            this.start();
        },
        start: function () {
            $(window).on("load ul.o_menu_systray", _.bind(this.on_show, this));
            this.load_report();
        },
        load_report: function () {
            var self = this;
            ajax.jsonRpc('/report/get_report_html/', 'call', {
                report_id: this.report_id,
            }).done(function (res) {
                Attributes = res.attributes;
                if (res) {
                    var $inner_content = $(res.template).html();
                    var $content = $('<div/>')
                        .attr({
                            'class': 'main_page',
                            'data-oe-id': res.id,
                            'data-oe-xpath':".",
                            'data-oe-field':"arch" ,
                            'data-oe-model':"ir.ui.view"
                        })
                        .html($inner_content);
                    $('main').html($content);
                    _.each($('[t-field]'), function (span) {
                        span = $(span);
                        var span_text = span.attr('t-field');
                        span.html(span_text);
                    });
                    _.each($('[t-raw]'), function (span) {
                        span = $(span);
                        var span_text = span.attr('t-raw');
                        span.html(span_text);
                    });
                    _.each($('[t-esc]'), function (span) {
                        span = $(span);
                        var span_text = '<b> Esc: </b>' + span.attr('t-esc');
                        span.html(span_text);
                    });
                    _.each($('[t-set][t-value]'), function (span) {
                        span = $(span);
                        var span_text = '<b> Set: </b>' + span.attr('t-set') + ' <b> Value: </b>'+ span.attr('t-value');
                        span.html(span_text);
                    });
                    $('.report_loader').hide();
                }else{
                    window.location = '/report/editor';
                }
            });
        },
        on_show: function () {
            var self = this;
            $('header, footer').remove();
            $('div.navbar').remove();
            $('div#footer').remove();

            $('#report-customize-menu .dropdown-item').on('click', function (e) {
                var id = $(e.currentTarget).attr('id');
                if (id !== 'html_editor') {
                    e.stopPropagation();
                }
            });

            /* Remove Process in navbar */
            var checkExist = setInterval(function () {
                if ($('.o_planner_systray').length) {
                    $('.o_planner_systray').hide();
                    clearInterval(checkExist);
                }
            }, 100);

            /* remove unnecessary menu */
            _.each($('ul.o_menu_systray').children(), function (elem) {
                elem = $(elem);
                var data_action = ("" + elem.find('a[data-action]').attr('data-action')).toString().trim();
                var class_name = ("" + elem.attr('class')).toString().trim();
                if (data_action === 'edit' || class_name.indexOf('report_customize_menu') !== -1) {
                    return;
                } else {
                    elem.remove();
                }
            });

            /* Preview Button Click Event */
            $('a#report_preview').click(function (e) {
                var url = window.location.href.replace('/edit/', '/preview/');
                window.open(url, '_blank');
            });

            /* Export Button Click Event */
            $('a#report_export').click(function (e) {
                new dialog(self, "Export Report").open();
            });

            /* Fill Report Record in selection box */
            rpc.query({
                model: 'report.designer',
                method: 'get_record_data',
                args: [this.report_id],
            }).then(function (data) {
                var option_text = '<option selected="true" disabled="disabled"><b> Select Report Record </b></option>';
                for (var r in data) {
                    if (self.record_id == parseInt(r)) {
                        option_text += '<option value="' + window.location.pathname + '?report_id=' + self.report_id + '&record_id=' + r + '" selected>' + data[r] + '</option>'
                    } else {
                        option_text += '<option value="' + window.location.pathname + '?report_id=' + self.report_id + '&record_id=' + r + '">' + data[r] + '</option>'
                    }
                }
                $('select#all_records').html(option_text).select2();
            }).then(function () {
                $('select#all_records').change(function () {
                    var href = $(this).val();
                    if (core.debug) {
                        href += "&debug=" + self.debug;
                    }
                    href = href.replace('/edit/', '/preview/')
                    window.open(href, '_blank');
                });
            });

            /* Fill Field Generator Record in selection box and Change Event */
            rpc.query({
                model: 'report.designer',
                method: 'get_field_data',
                args: [this.report_id],
            }).then(function (data) {
                var option_text = '<option selected="true" disabled="disabled"><b> Select Report Field </b></option>';
                for (var r in data) {
                    option_text += '<option value="' + r + '">' + data[r] + '</option>'
                }
                $('select#report_field_name').html(option_text);
            }).then(function () {
                $('select#report_field_name').on('change', function (e) {
                    $("input#report_field_generator").val('t-field="doc.' + $(this).val());
                });
            });
            var templates = $('#wrapwrap t[class*="template"]');
            templates.each(function (o, elt) {
                self.replaceTagName(elt);
            });
        },
        replaceTagName: function (elt) {
            var self = this;
            var newElt = $("<fieldset></fieldset>");
            Array.prototype.slice.call(elt.attributes).forEach(function (a) {
                newElt.attr(a.name, a.value);
            });
            var $legend = $('<legend>&lt; Template &gt;</legend>').css({
                'display': 'block',
                'font-weight': 'bold',
                'font-size': '12px',
                'margin': 0
            }).attr({
               'class': 'placeholder',
                'contenteditable': 'false'
            });
            $(elt).wrapInner(newElt).children(0).unwrap().append($legend);
            var tags = $(elt).find('t[class*="template"]');
            if (tags.length) {
                tags.each(function (o, elt) {
                    self.replaceTagName(elt);
                });
            }
        }
    });

    if (misc.is_report_editor()) {
        new ReportEditor();
    }
    if (misc.is_report_main_page()) {
        $(document).ready(function (e) {
            $('select#model').select2();
        });
    }

    snippet_editor.Class.include({
        _getSnippetURL: function () {
            if (misc.is_report_editor()) {
                return '/report-designer-snippets';
            }
            return '/website/snippets';
        }
    });

    Editor.Class.include({
        save: function (reload) {
            var self = this;
            if (qs_obj.report_id && misc.is_report_editor()) {
                $('span[t-field], p[t-field], [t-esc], [t-set][t-value],[t-raw]').html('');
                var tags = $('#wrapwrap fieldset[class*="template"]');
                tags.each(function (o, elt) {
                    self.replaceTagName(elt);
                });
                $('#wrapwrap legend[class*="placeholder"]').remove();
            }
            try {
                return this._super.apply(this, arguments);
            } catch (ex) {
                window.location = window.location.href;
            }
        },
        replaceTagName: function (elt) {
            var self = this;
            var newElt = $("<t/>");
            Array.prototype.slice.call(elt.attributes).forEach(function (a) {
                newElt.attr(a.name, a.value);
            });
            $(elt).wrapInner(newElt).children(0).unwrap();
            var tags = $(elt).find('fieldset[class*="template"]');
            if (tags.length) {
                tags.each(function (o, elt) {
                    self.replaceTagName(elt);
                });
            }
        }
    });

    snippet_editor.Editor.include({
        init: function (BuildingBlock, dom) {
            this._super.apply(this, arguments);
            if (qs_obj.report_id && misc.is_report_editor()) {
                this.events = _.extend(this.events, {
                    'click .oe_snippet_attribute': 'on_attribute'
                });
                if(("" + this.$target.attr('class')).indexOf('main_page') === -1) {
                    $('a#oe_snippet_attribute').removeClass("d-none");
                    $('a#oe_snippet_remove_tr').removeClass("d-none");
                    $('a#oe_snippet_add_tr').removeClass("d-none");
                }
            }
        },
        _initializeOptions: function () {
            if (qs_obj.report_id && misc.is_report_editor()) {
                var self = this;
                var $styles = this.$el.find('.oe_options');
                var $ul = $styles.find('.dropdown-menu:first');
                this.styles = {};
                this.selectorSiblings = [];
                this.selectorChildren = [];

                var i = 0;
                $ul.append($('<div/>', {class: 'dropdown-header o_main_header', text: this._getName()}).data('editor', this));
                var defs = _.map(this.templateOptions, function (val, option_id) {
                    if (!val.selector.is(self.$target)) {
                        return;
                    }
                    if (val['drop-near']) self.selectorSiblings.push(val['drop-near']);
                    if (val['drop-in']) self.selectorChildren.push(val['drop-in']);

                    var optionName = val.option;
                    var $el = val.$el.children().clone(true).addClass('snippet-option-' + optionName);
                    var option = new (options.registry[optionName] || options.Class)(
                        self,
                        val.base_target ? self.$target.find(val.base_target).eq(0) : self.$target,
                        self.$el,
                        val.data
                    );
                    self.styles[optionName || _.uniqueId('option')] = option;
                    option.__order = i++;
                    return option.attachTo($el);
                });

                if(("" + this.$target.attr('class')).indexOf('main_page') === -1 && ("" + this.$target.attr('class')).indexOf('oe_structure') === -1) {
                    this.$el.find('.oe_snippet_move, .oe_snippet_clone, .oe_snippet_remove').removeClass('d-none');
                } else {
                    this.$el.find('.oe_snippet_move, .oe_snippet_clone, .oe_snipp et_remove').addClass('d-none');
                }

                this.$el.find('[data-toggle="dropdown"]').dropdown();

                return $.when.apply($, defs);

            } else {
                this._super.apply(this, arguments);
            }
        },
        on_attribute: function (event) {
            var self = this;
            var $target_el = this.$target;
            var attribute_obj = {};

            var $tr = $($target_el.closest('[t-foreach]'));

            for (var idx = 0, len = this.$target[0].attributes.length; idx < len; idx++) {
                attribute_obj[this.$target[0].attributes[idx].name] = this.$target[0].attributes[idx].nodeValue
            }
            var report_id = qs_obj.report_id;
            wUtils.prompt({
                id: "report_designer_attribute",
                window_title: _t("Set Attribute"),
                init: function () {
                    var self = this;
                    this.$dialog.find('.modal-dialog').addClass('modal-lg');
                    this.$dialog.find(".btn-continue").html('Save').addClass('btn-save').removeClass('btn-continue');
                    this.$dialog.find("#report_designer_attribute").html('');
                    var isForeach = !("t-foreach" in attribute_obj) && $tr.length && $tr.attr('t-foreach') ? $tr.attr('t-foreach') : null;
                    ajax.jsonRpc('/report_designer/dialog', 'call', {
                        'report_id': report_id,
                        'attribute_obj': attribute_obj,
                        'foreach_field': isForeach
                    }).then(function (result) {
                        // Load Modal content
                        self.$dialog.find("#report_designer_attribute").html(QWeb.render('report_designer_dialogbox', {
                            field_names: result.field_names,
                            function_names: result.function_names,
                            attribute_obj: attribute_obj,
                            relation_field_names: result.relation_field_names,
                            as: isForeach ? $tr.attr('t-as') : null
                        })).after(QWeb.render('WidgetGeneratorSelection', {widgets: result.report_widget}));

                        self.update_attribute_selection(attribute_obj);

                        self.$dialog.find("#m-fld-normal-m2o, #m-fld-m2m-o2m, #m-rel-fld, #m-fn, #chld-fld").select2();

                        self.update_option_color(self.$dialog);

                        self.$dialog.find("#attribute_type").on('change', function (e) {
                            self.selected_text = $(this).val().trim();
                            self.json_val = Attributes['all'][self.selected_text] ? Attributes['all'][self.selected_text] : null;
                            self.$dialog.find("#m-fld-normal-m2o, #m-fld-m2m-o2m, #m-rel-fld, #m-fn, #chld-fld, #widget_name").val('').trigger('change.select2');

                            self.$dialog.find(".attr-1 > .attr-inner, .attr-1 > .c-attr-1-custom-type, .attr-2").addClass('d-none');
                            self.$dialog.find(".attr-1").removeClass('d-none');

                            $('#m-rel-fld').html('');

                            self.$dialog.find("#custom_attribute_type, #attribute_value, #second_attribute_type, #second_attribute_value").removeClass('input-attr-value-err');

                            if(Object.keys(Attributes['option']).includes(self.selected_text)){
                                self.$dialog.find('#report_designer_attribute').addClass('col-sm-8');
                                self.$dialog.find('#widget-selection').addClass('col-sm-4').removeClass('d-none');
                            }else{
                                self.$dialog.find('#report_designer_attribute').removeClass('col-sm-8');
                                self.$dialog.find('#widget-selection').removeClass('col-sm-4').addClass('d-none');
                            }

                            self.$dialog.find(".attr-1, .attr-1 > .attr-inner , .attr-2, .c-m-sel").removeClass('d-none');
                            self.$dialog.find(".c-m-fld-normal-m2o, .c-m-rel-fld, .c-m-fld-m2m-o2m, .c-m-fn").removeClass('d-none');
                            if(Object.keys(Attributes['normal']).includes(self.selected_text) || Object.keys(Attributes['option']).includes(self.selected_text)){
                                self.$dialog.find(".attr-1 > .attr-inner, .attr-2").addClass('d-none');
                                self.$dialog.find(".attr-1").removeClass('d-none');
                            } else if (Object.keys(Attributes['iterable']).includes(self.selected_text)){
                                self.$dialog.find(".child_object").addClass('d-none');
                                self.$dialog.find(".c-m-fld-normal-m2o, .c-m-rel-fld").addClass('d-none');
                            } else if (Object.keys(Attributes['use_with_field']).includes(self.selected_text)) {
                                self.$dialog.find(".c-m-fld-m2m-o2m, .c-m-fn").addClass('d-none');
                                if(isForeach){
                                    self.$dialog.find(".c-m-sel").addClass('d-none');
                                }
                            } else if (!self.selected_text.startsWith('t-')) {
                                self.$dialog.find(".attr-1 > .attr-inner , .attr-2, .c-m-sel").addClass('d-none');
                                self.$dialog.find(".c-m-fld-normal-m2o, .c-m-rel-fld, .c-m-fld-m2m-o2m, .c-m-fn").addClass('d-none');
                            }

                            if (self.selected_text == "custom") {
                                self.$dialog.find(".c-attr-1-custom-type").removeClass('d-none');
                                self.$dialog.find("#custom_attribute_type").val('');
                            }

                            if (self.selected_text in attribute_obj) {
                                self.$dialog.find("#attribute_value").val(attribute_obj[self.selected_text]);
                                if (attribute_obj[self.selected_text].indexOf('doc.') !== -1) {
                                    self.$dialog.find("#m-fld-normal-m2o, #m-fld-m2m-o2m, #m-fn").val(attribute_obj[self.selected_text]).trigger('change.select2');
                                } else if ($tr.length && attribute_obj[self.selected_text].indexOf($tr.attr('t-as') + '.') !== -1) {
                                    self.$dialog.find("#chld-fld").val(attribute_obj[self.selected_text]).trigger('change.select2');
                                } else {
                                    self.$dialog.find('#m-fld-normal-m2o').val('');
                                }
                                self.update_button(self.selected_text, 'Update', 1);
                            } else {
                                self.$dialog.find("#attribute_value").val('');
                                self.update_button(self.selected_text, 'Add');
                            }
                            if (self.json_val) {
                                var second_attr = self.$dialog.find("#second_attribute_type, #second_attribute_value");
                                second_attr.parent().parent().addClass('d-none');
                                second_attr.val('');
                                if (self.json_val.second_attribute) {
                                    second_attr.parent().parent().removeClass('d-none');
                                    self.$dialog.find("#second_attribute_type").val(self.json_val.second_attribute);
                                    var $s_value = self.$dialog.find("#second_attribute_value");
                                    $s_value.val(self.json_val.second_attribute in attribute_obj ? attribute_obj[self.json_val.second_attribute] : '');
                                    if(Object.keys(Attributes['iterable']).includes(self.selected_text) && !$s_value.val()){
                                        self.$dialog.find("#second_attribute_value").val('line');
                                    }
                                }
                            }
                            if (self.selected_text) {
                                $('.c-add-remove').removeClass('d-none');
                            } else {
                                $('.attr-1, .attr-1 > .attr-inner, .attr-2, .c-add-remove').addClass('d-none');
                            }
                        });

                        self.$dialog.find("#m-fld-normal-m2o, #m-fld-m2m-o2m, #m-fn, #chld-fld, #widget_name").on('change', function (e) {
                            $('#m-rel-fld').html('');
                            self.$dialog.find("#attribute_value").val($(this).val());
                            if($(this).prop('id') == 'm-fld-normal-m2o'){
                                var field = $(this).val().split('.')[1];
                                var relation_model = result.field_names[field]['relation'];
                                if(relation_model){
                                    rpc.query({
                                        model: 'ir.model.fields',
                                        method: 'search_read',
                                        domain: [['model', '=', relation_model]],
                                        fields: ['name', 'field_description', 'ttype']
                                    }).then(function (relation_fields) {
                                        var $rel_selection_html = $(QWeb.render('MainObjectRelationFields', {
                                            fields: relation_fields,
                                            obj: field
                                        }));
                                        $('#m-rel-fld').html($rel_selection_html);
                                    })
                                }
                            }
                        });

                        self.$dialog.find("#m-rel-fld").on('change', function (e) {
                            self.$dialog.find("#attribute_value").val($(this).val());
                        });

                        self.$dialog.find("#save_close").on('click', function (e) {
                            if(!self._checkAttrValue()){
                                return false;
                            }
                            self.$dialog.find("#add_update_attr").trigger('click');
                            self.$dialog.find('.btn-save').trigger('click');
                        });

                        self.$dialog.find("#add_update_attr").on('click', function (e) {
                            e.preventDefault();
                            if (!self._checkAttrValue()) {
                                return false;
                            }
                            var sel_key = self.selected_text == "custom" ? self.$dialog.find("#custom_attribute_type").val() : self.selected_text;
                            attribute_obj[sel_key] = self.$dialog.find("#attribute_value").val();
                            if (self.json_val) {
                                if (self.json_val.second_attribute) {
                                    attribute_obj[self.$dialog.find("#second_attribute_type").val()] = self.$dialog.find("#second_attribute_value").val();
                                }
                            }
                            self.update_attribute_selection(attribute_obj);
                            self.update_button(self.selected_text, 'Update', 1);
                            self.$dialog.find("#attribute_type option[value='']").prop('selected', true).trigger('change');
                        });

                        self.$dialog.find("#remove_attr").on('click', function (e) {
                            e.preventDefault();
                            delete attribute_obj[self.selected_text];
                            if (self.json_val) {
                                if (self.json_val.second_attribute) {
                                    delete attribute_obj[self.$dialog.find("#second_attribute_type").val()];
                                }
                            }
                            self.update_attribute_selection(attribute_obj);
                            self.update_button(self.selected_text, 'Add');
                            self.$dialog.find("#attribute_type option[value='']").prop('selected', true).trigger('change');
                        });

                        self.$dialog.find("#attribute_type option[value='t-field']").prop('selected', true).trigger('change');
                    });
                },
                _checkAttrValue:function(){
                    if (!this.selected_text.length) return true;
                    var $allFields = null, cnt = 0;
                    if (this.selected_text == "custom") {
                        $allFields = this.$dialog.find("#custom_attribute_type, #attribute_value");
                    }else if (this.json_val && this.json_val.second_attribute) {
                        $allFields = this.$dialog.find("#attribute_value, #second_attribute_type, #second_attribute_value");
                    }else {
                        $allFields = this.$dialog.find("#attribute_value");
                    }
                    _.each($allFields, function (field) {
                        field = $(field);
                        if (!field.val().length) {
                            field.addClass('input-attr-value-err');
                            cnt++;
                        }
                    });
                    if (cnt > 0) {
                        alert("Attribute value required");
                        return false;
                    } else {
                        return true;
                    }
                },
                update_button: function (selected_text, btn_text, remove_btn) {
                    this.$dialog.find("#remove_attr").prop('disabled', !remove_btn);
                    this.$dialog.find("#add_update_attr").html(btn_text).prop('disabled', !selected_text.length);
                },
                update_option_color: function (dialog) {
                    _.each(dialog.find("#attribute_type option"), function (option) {
                        option = $(option);
                        option.removeAttr('style');
                        if (option.text().trim() in attribute_obj) {
                            option.css({
                                'color': 'green',
                                'font-weight': 'bold'
                            });
                        }
                    });
                },
                update_attribute_selection: function (attribute_obj) {
                    var _list = Object.keys(attribute_obj);
                    var flag = false, t = [], priority = 10;
                    _.each(_list, function (l) {
                        if (Attributes['all'][l]) {
                            if (priority > Attributes['all'][l].priority){
                                priority = Attributes['all'][l].priority;
                                if (Attributes['all'][l].is_renderable) flag = true;
                                if (Attributes['all'][l].with_attrs.length) {
                                    t = Attributes['all'][l].with_attrs;
                                }
                            }
                        }
                    });
                    if (!flag) {
                        t = Object.keys(Attributes['all']);
                    } else {
                        t = t.concat(Object.keys(Attributes['normal']));
                    }
                    t = _.uniq(t.concat(_list));
                    t = _.filter(t, function (a) {
                        return !Attributes['sec_attrs'].includes(a)
                    });
                    t.sort();
                    this.$dialog.find("select#attribute_type").html(QWeb.render('AttributeSelection', {attribute_types: t}));
                    this.update_option_color(this.$dialog);
                }
            }).then(function (val, field, $dialog) {
                if($target_el.attr('t-foreach')){
                    var oldAttr = $target_el.attr('t-as');
                    var newAttr = attribute_obj['t-as'];
                    $target_el.html($target_el.html().split(oldAttr + '.').join(newAttr + '.'));
                }
                $target_el.each(function () {
                    var attributes = $.map(this.attributes, function (item) {
                        return item.name;
                    });
                    var tag = $(this);
                    $.each(attributes, function (i, item) {
                        tag.removeAttr(item);
                    });
                });

                for (var key in attribute_obj) {
                    $target_el.attr(key, attribute_obj[key]);
                }

                self.trigger_up('request_history_undo_record', {$target: $target_el});
                if ($target_el.attr('t-field')) {
                    $target_el.html($target_el.attr('t-field'));
                }
                if ($target_el.attr('t-raw')) {
                    $target_el.html($target_el.attr('t-raw'));
                }
                if ($target_el.attr('t-esc')) {
                    $target_el.html('<b>Esc: </b>' + $target_el.attr('t-esc'));
                }
                if ($target_el.attr('t-set') && $target_el.attr('t-value')) {
                    var span_text = '<b> Set: </b>' + $target_el.attr('t-set') + ' <b> Value: </b>'+ $target_el.attr('t-value');
                    $target_el.html(span_text);
                }
            });
        }
    });
});
