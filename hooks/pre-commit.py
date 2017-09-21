#! /usr/bin/python
import sys
import os
import subprocess
import click
import re
import glob2
import logging

devnull = open(os.devnull, "wb")

git_repo, err = subprocess.Popen("git rev-parse --show-toplevel".split(), stdout=subprocess.PIPE).communicate()
git_repo = git_repo.strip()

output, err = subprocess.Popen("git diff --name-only --cached".split(), stdout=subprocess.PIPE, cwd=git_repo).communicate()

output = output.splitlines()
staged_files = {os.path.abspath(file) for file in output}

output, err = subprocess.Popen(["git", "ls-files", git_repo], stdout=subprocess.PIPE, cwd=git_repo).communicate()
output = output.splitlines()
all_files = {os.path.abspath(file) for file in output}

def get_test_files(file):
	# We could just create a complete mapping of file to set of test files, but doing so would actually waste time since
	# we only need to find the test files for a small subset of files
	files = [_file for _file in glob2.glob(os.path.join(git_repo, "test/**/*")) if os.path.isfile(_file)]
	regex = r'.*re[quw]+ire(.*[/\\]%s")' % os.path.splitext(os.path.basename(file))[0]
	test_files = []
	for _file in files:
		for line in open(_file):
			if re.match(regex, line):
				test_files.append(_file)
				break

	return test_files

def has_test_suite(file):

	# Should have coverage report
	if not os.path.isfile(os.path.join(git_repo, "coverage/lcov-report/Node/", os.path.basename(file) + ".html")):
		click.echo(click.style("Failure!", fg="red"))
		click.echo()
		click.echo(click.style("Error: No coverage for test detected after running 'istanbul cover _mocha' in %s" % git_repo, fg="red"))
		return False
	
	# Get all the test files that this file is 'required' in
	test_files = get_test_files(file)
	click.echo("%s mentioned in %d files. Checking files..." % (file, len(test_files)))

	# For each test file, run some validity checks
	for test_file in test_files:
		click.echo("Validating test file %s..." % test_file, nl=False)
		
		# If test file is staged, then we have some new changes for the test suite, which is good
		if test_file in staged_files:
			click.echo(click.style("Success!", fg="green"))
			continue

		# If the test file isn't even tracked in the repo, then we cannot continue with the commit since we want the latest tests
		if test_file not in all_files:
			click.echo(click.style("Failure!", fg="red"))
			click.echo()		
			click.echo(click.style("Error: File not tracked in repository", fg="red"))
			return False

		
		# File exists in git, but we need to make sure that it is the latest version on git
		rc = subprocess.Popen(["git", "diff", "--exit-code", test_file], cwd=git_repo)
		rc.wait()
		if rc.returncode == 0:
			click.echo(click.style("Success!", fg="green"))
			continue
		else:
			click.echo(click.style("Failure!", fg="red"))
			click.echo()
			click.echo(click.style("Error: File exists, but it has unstaged changes.", fg= "red"))
			return False

	return True

def has_valid_coverage(file, threshold=80.0):
	# Get coverage page for file
	html = subprocess.check_output(["cat", os.path.join(git_repo, "coverage/lcov-report/Node/", os.path.basename(file) + ".html")])
	
	click.echo("Validating coverage number for %s..." % file, nl=False)
	
	# Find all the percentages
	percentages = [float(percentage[:-1]) for percentage in re.findall(r'[.0-9]+%', html)]
	
	# If any are below the threshold, fail
	if [percentage for percentage in percentages if percentage < threshold]:
		click.echo(click.style("Failure!", fg="red"))
		click.echo()
		click.echo(click.style("Error: Coverage lower than %.2f%% for file %s" % (threshold, os.path.basename(file)), fg="red"))

		click.echo(click.style("\tCoverage Values:", fg="red"))

		# Print out the coverage values
		values = ["Statements:", "Branches:", "Functions:", "Lines:\t"]
		for i in range(len(values)):
			percentage = percentages[i]
			value = values[i]

			color = "red"
			if percentage > threshold:
				color = "green"
			elif percentage > threshold - 15:
				color = "yellow"
			
			click.echo(click.style("\t\t%s\t%.2f%%" % (value, percentage), fg=color))
		click.echo()

		return False

	# None are below the threshold, so we succeed!
	click.echo(click.style("Success!", fg="green"))
	return True

def verify_file(file):
	filename, file_extension = os.path.splitext(os.path.basename(file))
	# File must be javascript file
	if file_extension != ".js":
		return True

	# Must have corresponding test file
	if not has_test_suite(file):
		exit(1)
	
	# Coverage for file must exceed minimum threshold
	if not has_valid_coverage(file):
		exit(1)
	return True

def verify_files(files):
	files = files[0].splitlines()
	[verify_file(file) for file in files]
	exit(0)


if __name__ == "__main__":
	verify_files(sys.argv[1:])