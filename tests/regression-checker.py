"""Exercise real outputs, a wrong result, falsely successful stops and unavailable execution."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import sys

root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('regression',root/'practice/check-regression.py')
checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)

class CheckerTests(unittest.TestCase):
    def test_confirmed_fields_and_false_boolean(self):
        self.assertEqual(checker.compare({'total':1},{'total':True})[0]['field'],'total')
        self.assertEqual(checker.compare({'average':65.0},{'average':39})[0]['actual'],39)

    def test_real_suite_and_existing_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'results'
            command=[sys.executable,str(root/'practice/check-regression.py'),'--out',str(out)]
            first=subprocess.run(command,capture_output=True,text=True)
            self.assertEqual(first.returncode,0,first.stderr)
            self.assertEqual(json.loads((out/'regression.json').read_text())['verdict'],'PASS')
            before=(out/'regression.json').read_bytes()
            second=subprocess.run(command,capture_output=True,text=True)
            self.assertNotEqual(second.returncode,0)
            self.assertEqual((out/'regression.json').read_bytes(),before)

    def test_wrong_report_detected_despite_validation_pass(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp);target=out/'normal';target.mkdir()
            script=root/'practice/ticket-daily-report/scripts/pipeline.py'
            expected=json.loads((root/'practice/expected/2026-10-10.json').read_text())
            expected['average_completed_minutes']=39
            (target/'report.json').write_text(json.dumps(expected))
            (target/'report.txt').write_text('Fictional report')
            source=root/'practice/fixtures/normal.json'
            (target/'evidence.json').write_text(json.dumps({'validation':'PASS',
                'input_sha256':checker.digest(source),'script_sha256':checker.digest(script)}))
            with patch.object(checker.subprocess,'run',return_value=subprocess.CompletedProcess([],0,'','')):
                case=checker.run_case(*checker.CASES[0],script,out)
            self.assertEqual(case['verdict'],'FAIL')
            self.assertEqual(case['differences'][0]['field'],'average_completed_minutes')

    def test_stop_must_have_no_success_output(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp);(out/'missing-field').mkdir()
            script=root/'practice/ticket-daily-report/scripts/pipeline.py'
            with patch.object(checker.subprocess,'run',return_value=subprocess.CompletedProcess([],1,'','STOP: 缺字段')):
                case=checker.run_case(*checker.CASES[2],script,out)
            self.assertEqual(case['verdict'],'FAIL')

    def test_execution_timeout_is_unknown(self):
        with tempfile.TemporaryDirectory() as temp:
            script=root/'practice/ticket-daily-report/scripts/pipeline.py'
            with patch.object(checker.subprocess,'run',side_effect=subprocess.TimeoutExpired([],30)):
                case=checker.run_case(*checker.CASES[0],script,Path(temp))
            self.assertEqual(case['verdict'],'UNKNOWN')

if __name__=='__main__':unittest.main()
