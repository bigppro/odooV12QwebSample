# -*- coding: utf-8 -*-
# Part of Odoo Module Developed by 73lines
# See LICENSE file for full copyright and licensing details.
{
    'name': 'Report Designer by 73Lines',
    'summary': 'Tool to make qweb report',
    'category': 'Extra Tools',
    'version': '12.0.1.0.3',
    'author': '73Lines',
    'website': 'https://www.73lines.com/',
    'description': """
Report Designer by 73Lines
==========================
Tool to make reports(PDF & HTML) for specific objects
in just couple of minutes with drag&drop functionality.
""",
    'depends': ['website'],
    'data': [
        'data/report.widget.csv',
        'data/tag_attribute_data.xml',
        'security/ir.model.access.csv',
        'views/templates.xml',
        'views/custom_report_blocks.xml',
        'views/report_snippets.xml',
        'views/tag_attribute_views.xml',
        'views/report_widget_views.xml',
        'views/report_website_views.xml',
    ],
    'price': 299,
    'currency': 'EUR',
    'license': 'OPL-1',
    'installable': True,
    'application': True,
}
