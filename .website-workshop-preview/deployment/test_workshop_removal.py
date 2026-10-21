"""Test the real route in isolation: no credentials, cloud clients or live writes."""
import ast
from copy import deepcopy
import os
from pathlib import Path
from types import SimpleNamespace
import unittest
from werkzeug.utils import secure_filename

SOURCE = Path(os.environ.get('WORKSHOP_API_SOURCE', str(Path(__file__).with_name('musicgen.py'))))


class WorkshopRemovalTests(unittest.TestCase):
    def setUp(self):
        names = {'manage_website_workshops', '_validated_path_component'}
        tree = ast.parse(SOURCE.read_text(encoding='utf-8'))
        nodes = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name in names]
        self.assertEqual(len(nodes), 2)
        for node in nodes:
            node.decorator_list = []
        self.config = {
            'websiteWorkshopIds': ['New Haven AM July 27', 'New Haven PM July 27',
                                   'New_Haven_AM_July_27', 'BostonOct22'],
            'workshopIds': ['film-class'], 'missionWorkshopIds': ['mission-class'],
            'managementPassword': 'admin-test', 'openaiKeys': ['test-key'],
        }
        self.writes = []
        self.payload = {}
        def write_config(config):
            self.writes.append(deepcopy(config))
            self.config = deepcopy(config)
        self.ns = {
            'request': SimpleNamespace(get_json=lambda **kw: self.payload),
            'jsonify': lambda value: value,
            'secure_filename': secure_filename,
            'check_admin_password': lambda value: value == 'admin-test',
            'load_config': lambda: deepcopy(self.config),
            'write_config': write_config,
        }
        exec(compile(ast.Module(body=nodes, type_ignores=[]), str(SOURCE), 'exec'), self.ns)

    def call(self, action, workshop_id, password='admin-test'):
        self.payload = dict(action=action, workshop_id=workshop_id, managementPassword=password)
        return self.ns['manage_website_workshops']()

    def test_remove_each_legacy_spaced_id_without_changing_other_config(self):
        expected = deepcopy(self.config)
        for name in ['New Haven AM July 27', 'New Haven PM July 27']:
            result = self.call('remove', name)
            expected['websiteWorkshopIds'].remove(name)
            self.assertEqual(result, {'workshops': expected['websiteWorkshopIds']})
            self.assertEqual(self.config, expected)
        self.assertIn('New_Haven_AM_July_27', self.config['websiteWorkshopIds'])

    def test_add_still_rejects_spaces_and_accepts_normal_ids(self):
        before = deepcopy(self.config)
        self.assertEqual(self.call('add', 'New Haven PM July 27')[1], 400)
        self.assertEqual(self.config, before)
        self.assertEqual(self.writes, [])
        self.assertIn('New_Class-2026', self.call('add', 'New_Class-2026')['workshops'])

    def test_removal_requires_admin_and_retains_path_validation(self):
        before = deepcopy(self.config)
        self.assertEqual(self.call('remove', 'New Haven AM July 27', password='wrong')[1], 403)
        for invalid in ['../class', 'a/b', 'a\\b', 'bad\x00name', '']:
            self.assertEqual(self.call('remove', invalid)[1], 400)
        self.assertEqual(self.config, before)
        self.assertEqual(self.writes, [])

    def test_list_and_repeated_remove_remain_supported(self):
        self.assertEqual(self.call('list', None), {'workshops': self.config['websiteWorkshopIds']})
        self.call('remove', 'New Haven AM July 27')
        expected = deepcopy(self.config)
        self.assertEqual(self.call('remove', 'New Haven AM July 27'), {'workshops': expected['websiteWorkshopIds']})
        self.assertEqual(self.config, expected)


if __name__ == '__main__':
    unittest.main()
