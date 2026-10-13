"""Exercise real outputs, a wrong result, falsely successful stops and unavailable execution."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
import zipfile
from unittest.mock import patch
import sys

root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('regression',root/'practice/ticket-daily-report/tests/check-regression.py')
checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)

class CheckerTests(unittest.TestCase):
    def test_confirmed_fields_and_false_boolean(self):
        self.assertEqual(checker.compare({'total':1},{'total':True})[0]['field'],'total')
        self.assertEqual(checker.compare({'average':65.0},{'average':39})[0]['actual'],39)

    def test_real_suite_and_existing_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            out=Path(temp)/'results'
            command=[sys.executable,str(root/'practice/ticket-daily-report/tests/check-regression.py'),'--out',str(out)]
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
            expected=json.loads((root/'practice/ticket-daily-report/tests/expected/2026-10-10.json').read_text())
            expected['average_completed_minutes']=39
            (target/'report.json').write_text(json.dumps(expected))
            (target/'report.txt').write_text('Fictional report')
            source=root/'practice/ticket-daily-report/tests/fixtures/normal.json'
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

    def test_downloads_are_portable_and_evals_share_standards(self):
        for name in ('practice-kit.zip', 'ticket-daily-report.zip'):
            with self.subTest(download=name), tempfile.TemporaryDirectory() as temp:
                workspace=Path(temp)
                with zipfile.ZipFile(root/'dist/downloads'/name) as archive:
                    members=archive.namelist()
                    self.assertTrue(all(not m.startswith(('fixtures/', 'expected/', 'example-results/')) for m in members))
                    self.assertNotIn('check-regression.py',members)
                    self.assertTrue(all('__pycache__' not in m and not m.endswith('.pyc') for m in members))
                    archive.extractall(workspace/'unpacked')
                skill=workspace/'unpacked/ticket-daily-report'
                # Documented command from the Skill directory.
                result=subprocess.run([sys.executable,'tests/check-regression.py','--out',
                    '../ticket-regression-first'],cwd=skill,capture_output=True,text=True)
                self.assertEqual(result.returncode,0,result.stderr)
                # Resolving resources must also work when the caller is elsewhere.
                result=subprocess.run([sys.executable,str(skill/'tests/check-regression.py'),
                    '--out',str(workspace/'from-other-cwd')],cwd=workspace,capture_output=True,text=True)
                self.assertEqual(result.returncode,0,result.stderr)
                regression=json.loads((workspace/'from-other-cwd/regression.json').read_text())
                scenarios=json.loads((skill/'evals/evals.json').read_text())
                self.assertEqual(scenarios['skill_name'],'ticket-daily-report')
                self.assertEqual(len(scenarios['evals']),len(checker.CASES))
                self.assertEqual(len({s['id'] for s in scenarios['evals']}),len(checker.CASES))
                for scenario,case in zip(scenarios['evals'],regression['cases']):
                    self.assertTrue(scenario['prompt'] and scenario['assertions'] and scenario['expected_output'])
                    self.assertNotIn('verdict',scenario) # Scenarios are not claimed execution results.
                    self.assertEqual(len(scenario['files']),1)
                    input_path=skill/scenario['files'][0]
                    self.assertTrue(input_path.is_file())
                    self.assertEqual(checker.digest(input_path),case['input_sha256'])
                    self.assertIn(input_path.name,scenario['prompt'])
                    if 'expected_file' in scenario:
                        expected_path=skill/scenario['expected_file']
                        self.assertEqual(json.loads(expected_path.read_text()),case['expected'])
                        self.assertEqual(checker.digest(expected_path),case['expected_sha256'])
                # The downloaded first-run command remains usable as well.
                first=subprocess.run([sys.executable,'scripts/pipeline.py','--input',
                    'tests/fixtures/normal.json','--date','2026-10-10','--out','../ticket-first-run'],
                    cwd=skill,capture_output=True,text=True)
                self.assertEqual(first.returncode,0,first.stderr)
                report=json.loads((skill.parent/'ticket-first-run/report.json').read_text())
                self.assertEqual(report['average_completed_minutes'],65)

if __name__=='__main__':unittest.main()
