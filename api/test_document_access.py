import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from document_access import filter_published_documents

class DocumentAccessTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.file = Path(self.folder.name) / 'sop-data.json'
        self.data = {'departement': [{'id': 1, 'nama_departement': 'MIS'}], 'sopdoc': [
            {'id': 1, 'type_doc': 'READ', 'departement_id': 1, 'nama_dokumen': 'Active SOP', 'no_dokumen': 'SOP-1', 'file': 'current.pdf', 'tgl_berlaku': '2026-10-19'},
            {'id': 2, 'type_doc': 'READ', 'departement_id': 1, 'nama_dokumen': 'Waiting SOP', 'no_dokumen': 'SOP-2', 'file': 'waiting.pdf', 'tgl_berlaku': '2026-10-20'},
            {'id': 3, 'type_doc': 'READ', 'departement_id': 1, 'nama_dokumen': 'Deleted SOP', 'no_dokumen': 'SOP-3', 'file': 'deleted.pdf', 'deleted_at': '2026-10-19'},
        ], 'audit': [{'documentId': 3, 'before': {'nama_dokumen': 'Old deleted name'}, 'after': None}]}
        self.file.write_text(json.dumps(self.data))

    def filter(self, *metadata, today='2026-10-19'):
        docs = [SimpleNamespace(metadata=dict(item), page_content='private content') for item in metadata]
        return filter_published_documents(docs, self.file, today)

    def test_only_published_documents_reach_model(self):
        self.assertEqual(len(self.filter({'sop_doc_id': '1'}, {'sop_doc_id': '2'}, {'sop_doc_id': '3'}, {'sop_doc_id': '999'})), 1)
        self.assertEqual(len(self.filter({'sop_doc_id': '2'}, today='2026-10-20')), 1)

    def test_scheduled_hide_and_revision_switch_on_the_same_day(self):
        self.data['sopdoc'][0]['tgl_hide'] = '2026-10-20'
        self.data['sopdoc'].append({'id': 4, 'type_doc': 'READ', 'departement_id': 1, 'nama_dokumen': 'Active SOP', 'no_dokumen': 'SOP-1', 'file': 'rev1.pdf', 'tgl_berlaku': '2026-10-20', 'replaces_id': 1})
        self.file.write_text(json.dumps(self.data))
        before = self.filter({'sop_doc_id': '1'}, {'sop_doc_id': '4'}, {'source': 'MIS/Active SOP.pdf'})
        self.assertEqual([d.metadata['sop_doc_id'] for d in before], ['1', '1'])
        after = self.filter({'sop_doc_id': '1'}, {'sop_doc_id': '4'}, {'source': 'MIS/Active SOP.pdf'}, today='2026-10-20')
        self.assertEqual([d.metadata['sop_doc_id'] for d in after], ['4'])

    def test_legacy_aliases_and_deleted_old_names(self):
        docs = self.filter({'source': 'MIS/Active SOP.pdf'}, {'source': 'MIS/Old deleted name.pdf'}, {'source': 'MIS/Waiting SOP.pdf'})
        self.assertEqual(len(docs), 1)
        self.assertEqual(docs[0].metadata['sop_doc_id'], '1')

    def test_old_pdf_chunks_are_blocked_after_replacement(self):
        self.assertEqual(len(self.filter({'sop_doc_id': '1', 'source': 'sop/1/old.pdf'})), 0)
        self.assertEqual(len(self.filter({'sop_doc_id': '1', 'source': 'sop/1/current.pdf'})), 1)
        self.data['sopdoc'][0]['content_updated_at'] = '2026-10-19'
        self.file.write_text(json.dumps(self.data))
        self.assertEqual(len(self.filter({'source': 'MIS/Active SOP.pdf'})), 0)

    def test_missing_registry_fails_closed(self):
        with self.assertLogs('document_access', level='ERROR'):
            self.assertEqual(filter_published_documents([SimpleNamespace(metadata={'sop_doc_id': '1'})], self.file.with_suffix('.missing')), [])

if __name__ == '__main__':
    unittest.main()
