#!/usr/bin/env python3
"""
AI Template Upgrade Script

Checks for updates to the Prompt_Template repository and upgrades the local copy.
- Checks for new versions daily
- Clones the remote repository
- Overwrites local files with updated versions
- Preserves template.md files if they don't exist locally
- Cleans up temporary files
"""

import json
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import urllib.request
import urllib.error


class TemplateUpgrader:
    """Manages template upgrades from remote repository."""
    
    def __init__(self, repo_root: Path, ignore_delay: bool = False):
        self.repo_root = repo_root
        self.temp_dir = repo_root / "temp" / "upgrade_tmp"
        self.version_file = repo_root / "LAST_VERSION.json"
        self.last_check_file = repo_root / ".copilot-memory" / "upgrade_last_check.txt"
        self.remote_url = "https://github.com/goemktg/Prompt_Template.git"
        self.version_api = "https://raw.githubusercontent.com/goemktg/Prompt_Template/main/LAST_VERSION.json"
        self.ignore_delay = ignore_delay
        
    def _ensure_check_file_dir(self):
        """Create .copilot-memory directory if it doesn't exist."""
        self.last_check_file.parent.mkdir(parents=True, exist_ok=True)
    
    def _get_last_check_time(self) -> Optional[datetime]:
        """Get the time of the last version check."""
        self._ensure_check_file_dir()
        if not self.last_check_file.exists():
            return None
        try:
            with open(self.last_check_file, 'r') as f:
                timestamp = float(f.read().strip())
                return datetime.fromtimestamp(timestamp)
        except (ValueError, IOError):
            return None
    
    def _save_check_time(self):
        """Save current time as last check time."""
        self._ensure_check_file_dir()
        with open(self.last_check_file, 'w') as f:
            f.write(str(datetime.now().timestamp()))
    
    def _should_check_for_updates(self) -> bool:
        """Check if 24 hours have passed since last check."""
        if self.ignore_delay:
            return True
        
        last_check = self._get_last_check_time()
        if last_check is None:
            return True
        
        time_since_check = datetime.now() - last_check
        if time_since_check < timedelta(days=1):
            print(f"Already checked for updates today ({time_since_check.total_seconds() / 3600:.1f} hours ago).")
            print("Run again tomorrow or use --ignoreDelay option to force check.")
            return False
        return True
    
    def _fetch_remote_version(self) -> Optional[str]:
        """Fetch the latest version from remote repository."""
        try:
            print("Checking remote version...", end=" ")
            with urllib.request.urlopen(self.version_api, timeout=10) as response:
                data = json.loads(response.read().decode())
                version = data.get("version")
                print(f"Remote version: {version}")
                return version
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
            print(f"ERROR: Failed to fetch remote version: {e}")
            return None
    
    def _get_local_version(self) -> str:
        """Get the local version from LAST_VERSION.json."""
        try:
            with open(self.version_file, 'r') as f:
                data = json.loads(f.read())
                return data.get("version", "unknown")
        except (FileNotFoundError, json.JSONDecodeError):
            return "unknown"
    
    def _clone_repository(self):
        """Clone the remote repository to temp directory."""
        print(f"Cloning repository to {self.temp_dir}...", end=" ")
        
        # Remove existing temp directory
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)
        
        self.temp_dir.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", self.remote_url, str(self.temp_dir)],
                check=True,
                capture_output=True,
                timeout=60
            )
            print("Done")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
            print(f"ERROR: Failed to clone repository: {e}")
            return False
    
    def _get_existing_templates(self) -> set:
        """Get list of existing .template.md files in local repo."""
        template_files = set()
        for file in self.repo_root.rglob("*.template.md"):
            template_files.add(file.relative_to(self.repo_root))
        return template_files
    
    def _get_remote_templates(self) -> set:
        """Get list of .template.md files in cloned repo."""
        template_files = set()
        cloned_repo = self.temp_dir
        for file in cloned_repo.rglob("*.template.md"):
            template_files.add(file.relative_to(cloned_repo))
        return template_files
    
    def _should_skip_file(self, rel_path: Path, existing_templates: set, remote_templates: set) -> bool:
        """Determine if a file should be skipped during copy."""
        # Skip template.md files that don't exist locally
        if str(rel_path).endswith(".template.md"):
            if rel_path not in existing_templates and rel_path in remote_templates:
                return True
        
        # Skip .git directory and upgrade script
        if ".git" in rel_path.parts:
            return True
        if str(rel_path) == "scripts\\upgrade_ai.py" or str(rel_path) == "scripts/upgrade_ai.py":
            return True
        
        return False
    
    def _copy_files(self):
        """Copy files from cloned repo to local repo."""
        cloned_repo = self.temp_dir
        
        if not cloned_repo.exists():
            print("ERROR: Cloned repository not found")
            return False
        
        existing_templates = self._get_existing_templates()
        remote_templates = self._get_remote_templates()
        
        print("Copying files...", end=" ")
        copied_count = 0
        skipped_count = 0
        
        for cloned_file in cloned_repo.rglob("*"):
            if cloned_file.is_dir():
                continue
            
            rel_path = cloned_file.relative_to(cloned_repo)
            
            if self._should_skip_file(rel_path, existing_templates, remote_templates):
                skipped_count += 1
                continue
            
            local_file = self.repo_root / rel_path
            local_file.parent.mkdir(parents=True, exist_ok=True)
            
            try:
                shutil.copy2(cloned_file, local_file)
                copied_count += 1
            except IOError as e:
                print(f"\nWARNING: Failed to copy {rel_path}: {e}")
        
        print(f"Done ({copied_count} copied, {skipped_count} skipped)")
        return True
    
    def _cleanup_temp(self):
        """Delete temporary directory."""
        print("Cleaning up temporary files...", end=" ")
        try:
            if self.temp_dir.exists():
                shutil.rmtree(self.temp_dir)
            print("Done")
            return True
        except Exception as e:
            print(f"WARNING: Failed to cleanup temp directory: {e}")
            return False
    
    def upgrade(self) -> bool:
        """Execute the upgrade process."""
        print("=" * 60)
        print("AI Template Upgrade Script")
        print("=" * 60)
        
        # Check if we should update today
        if not self._should_check_for_updates():
            return True
        
        # Get versions
        local_version = self._get_local_version()
        print(f"Local version: {local_version}")
        
        remote_version = self._fetch_remote_version()
        if remote_version is None:
            print("Could not fetch remote version. Aborting upgrade.")
            return False
        
        # Save check time
        self._save_check_time()
        
        # Check if update is needed
        if local_version == remote_version:
            print(f"Already up to date (version {local_version})")
            return True
        
        print(f"Update available: {local_version} -> {remote_version}")
        
        # Clone and update
        if not self._clone_repository():
            return False
        
        if not self._copy_files():
            return False
        
        if not self._cleanup_temp():
            return False
        
        print("=" * 60)
        print(f"Upgrade completed successfully!")
        print(f"Template updated to version {remote_version}")
        print("=" * 60)
        return True


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Upgrade AI Template from remote repository"
    )
    parser.add_argument(
        "--ignoreDelay",
        action="store_true",
        help="Skip 24-hour check delay and force version check"
    )
    
    args = parser.parse_args()
    
    # Find repository root
    script_dir = Path(__file__).parent
    repo_root = script_dir.parent
    
    upgrader = TemplateUpgrader(repo_root, ignore_delay=args.ignoreDelay)
    
    try:
        success = upgrader.upgrade()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
