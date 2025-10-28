#!/usr/bin/env python3
"""
Quick test runner for RHACbot backend tests

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py -v           # Verbose mode
    python run_tests.py -c           # With coverage report
    python run_tests.py -h           # Show help
"""

import sys
import argparse
import subprocess
from pathlib import Path


def run_tests(verbose=False, coverage=False):
    """Run the test suite"""
    
    # Change to backend directory
    backend_dir = Path(__file__).parent
    
    if coverage:
        print("Running tests with coverage analysis...\n")
        
        # Run with coverage
        cmd = ['coverage', 'run', '-m', 'unittest', 'test_suite']
        if verbose:
            cmd.append('-v')
        
        result = subprocess.run(cmd, cwd=backend_dir)
        
        if result.returncode == 0:
            print("\n" + "="*70)
            print("Coverage Report:")
            print("="*70 + "\n")
            
            # Show coverage report
            subprocess.run(['coverage', 'report'], cwd=backend_dir)
            
            # Generate HTML report
            print("\nGenerating HTML coverage report...")
            subprocess.run(['coverage', 'html'], cwd=backend_dir)
            print(f"HTML report generated: {backend_dir}/htmlcov/index.html")
        
        return result.returncode
    else:
        # Run without coverage
        if verbose:
            cmd = ['python', '-m', 'unittest', '-v', 'test_suite']
        else:
            cmd = ['python', 'test_suite.py']
        
        result = subprocess.run(cmd, cwd=backend_dir)
        return result.returncode


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Run RHACbot backend tests',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_tests.py              Run all tests
  python run_tests.py -v           Run with verbose output
  python run_tests.py -c           Run with coverage report
  python run_tests.py -cv          Run with coverage and verbose
        """
    )
    
    parser.add_argument('-v', '--verbose',
                       action='store_true',
                       help='Verbose output')
    
    parser.add_argument('-c', '--coverage',
                       action='store_true',
                       help='Run with coverage analysis')
    
    args = parser.parse_args()
    
    # Check if coverage is installed when requested
    if args.coverage:
        try:
            import coverage
        except ImportError:
            print("ERROR: coverage is not installed.")
            print("Install it with: pip install coverage")
            return 1
    
    print("="*70)
    print("RHACbot Backend Test Suite")
    print("="*70 + "\n")
    
    return_code = run_tests(verbose=args.verbose, coverage=args.coverage)
    
    if return_code == 0:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
    
    return return_code


if __name__ == '__main__':
    sys.exit(main())
