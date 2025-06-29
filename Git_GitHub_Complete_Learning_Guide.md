# Git & GitHub Complete Learning Guide
*From Beginner to Expert*

## 📚 Table of Contents
1. [What is Git & GitHub?](#1-what-is-git--github)
2. [Installation & Setup](#2-installation--setup)
3. [Essential Git Concepts](#3-essential-git-concepts)
4. [Basic Git Commands](#4-basic-git-commands)
5. [Working with Branches](#5-working-with-branches)
6. [GitHub Fundamentals](#6-github-fundamentals)
7. [Collaboration Workflows](#7-collaboration-workflows)
8. [Advanced Git Features](#8-advanced-git-features)
9. [Best Practices](#9-best-practices)
10. [Expert-Level Topics](#10-expert-level-topics)
11. [Learning Path](#11-learning-path-recommendations)
12. [Practical Exercises](#12-practical-exercises)
13. [Additional Resources](#13-additional-resources)

---

## 1. What is Git & GitHub?

### Git
- **Git** is a distributed version control system
- Tracks changes in your code over time
- Allows multiple people to work on the same project
- Keeps a complete history of all changes

### GitHub
- **GitHub** is a cloud platform that hosts Git repositories
- Provides collaboration tools, issue tracking, and project management
- Think of it as "Google Drive for code" but much more powerful

### Why Use Git?
- **Version Control**: Never lose your work again
- **Collaboration**: Multiple developers can work together
- **Backup**: Your code is safely stored
- **History**: See exactly what changed and when
- **Branching**: Experiment without breaking main code

---

## 2. Installation & Setup

### Install Git
- **Windows**: Download from [git-scm.com](https://git-scm.com/)
- **Mac**: `brew install git` or download from git-scm.com
- **Linux**: `sudo apt install git` (Ubuntu/Debian)

### Initial Configuration
```bash
# Set your identity (required)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Optional but recommended settings
git config --global init.defaultBranch main
git config --global core.editor "code --wait"  # Use VS Code as editor
```

### Create GitHub Account
1. Go to [github.com](https://github.com)
2. Sign up for a free account
3. Verify your email

---

## 3. Essential Git Concepts

### Repository (Repo)
- A folder containing your project and its complete history
- Can be **local** (on your computer) or **remote** (on GitHub)

### Working Directory, Staging Area, Repository
```
Working Directory → Staging Area → Repository
     (edit)           (add)        (commit)
```

### Commits
- A **commit** is a snapshot of your project at a specific time
- Each commit has a unique ID (hash)
- Contains: changes, author, timestamp, message

### Branches
- **Branch**: An independent line of development
- **main/master**: The default primary branch
- Feature branches: Create new branches for features

---

## 4. Basic Git Commands

### Starting a Repository
```bash
# Method 1: Create new repository
mkdir my-project
cd my-project
git init

# Method 2: Clone existing repository
git clone https://github.com/username/repository-name.git
```

### Basic Workflow
```bash
# Check status of your files
git status

# Add files to staging area
git add filename.txt        # Add specific file
git add .                   # Add all files
git add *.js               # Add all .js files

# Commit changes
git commit -m "Your descriptive message"

# View commit history
git log
git log --oneline          # Compact view
```

### Checking Differences
```bash
# See what changed in working directory
git diff

# See what's staged for commit
git diff --staged

# See changes in specific file
git diff filename.txt
```

### Practice Exercise 1
```bash
# Create a practice repository
mkdir git-practice
cd git-practice
git init

# Create a file
echo "Hello, Git!" > hello.txt

# Add and commit
git add hello.txt
git commit -m "Add hello.txt"

# Make changes
echo "Learning Git is fun!" >> hello.txt

# See the changes
git status
git diff

# Commit the changes
git add hello.txt
git commit -m "Update hello.txt with learning message" # -m means short term of message

# View history
git log --oneline
```

---

## 5. Working with Branches

### Why Branches?
- Work on features without affecting main code
- Experiment safely
- Collaborate without conflicts

### Branch Commands
```bash
# Create and switch to new branch
git checkout -b feature-branch # -b means short term of branch
# Or in newer Git versions:
git switch -c feature-branch # -c means short term of create

# List all branches
git branch

# Switch between branches
git checkout main
# Or in newer Git version:
git switch main

# Delete a branch
git branch -d feature-branch # -d means short term of delete
```

### Merging
```bash
# Switch to main branch
git checkout main

# Merge feature branch into main
git merge feature-branch

# Delete merged branch
git branch -d feature-branch
```

### Practice Exercise 2
```bash
# In your git-practice directory
git checkout -b add-goodbye

# Create new file
echo "Goodbye, World!" > goodbye.txt
git add goodbye.txt
git commit -m "Add goodbye.txt" 

# Switch back to main
git checkout main

# Notice goodbye.txt is not here!
ls

# Merge the branch
git merge add-goodbye

# Now goodbye.txt is in main
ls

# Clean up
git branch -d add-goodbye
```

---

## 6. GitHub Fundamentals

### Connecting Local Repository to GitHub
```bash
# Create repository on GitHub first, then:

# Add remote origin
git remote add origin https://github.com/username/repository-name.git

# Push to GitHub
git push -u origin main # -u means short term of --set-upstream

# Check remote connections
git remote -v # -v means stort term of verbose
```

### Push, Pull, Fetch
```bash
# Push local changes to GitHub
git push

# Pull changes from GitHub to local
git pull

# Fetch changes without merging
git fetch
```

### Cloning and Contributing
```bash
# Clone someone else's repository
git clone https://github.com/username/project.git

# Make changes, then push
git add .
git commit -m "My contribution"
git push
```

### Practice Exercise 3
1. Create a new repository on GitHub
2. Clone it to your local machine
3. Add some files and commit them
4. Push to GitHub
5. Make changes on GitHub website
6. Pull changes to local machine

---

## 7. Collaboration Workflows

### Fork and Pull Request Workflow
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. Create a **feature branch**
4. Make changes and **commit**
5. **Push** to your fork
6. Create a **Pull Request**

### Example Workflow
```bash
# Fork repository on GitHub, then:
git clone https://github.com/yourusername/forked-repo.git
cd forked-repo

# Create feature branch
git checkout -b fix-typo

# Make changes
echo "Fixed typo" > fix.txt
git add fix.txt
git commit -m "Fix typo in documentation"

# Push to your fork
git push origin fix-typo

# Create Pull Request on GitHub
# Go to your fork on GitHub.com
# Click "Pull Requests" tab
# Click "New Pull Request" button
# Select base repository and branch
# Select your fork and feature branch
# Add title and description
# Click "Create Pull Request"
```

### Working with Remotes
```bash
# Add upstream remote (original repository)
git remote add upstream https://github.com/original/repo.git

# Keep your fork updated
git checkout main
git pull upstream main
git push origin main
```

---

## 8. Advanced Git Features

### Stashing
```bash
# Save work temporarily
git stash

# List stashes
git stash list

# Apply most recent stash
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

### Rebasing
```bash
# Rebase current branch onto main
git rebase main

# Interactive rebase (clean up commits)
git rebase -i HEAD~3
```

### Cherry Picking
```bash
# Apply specific commit from another branch
git cherry-pick commit-hash
```

### Reset and Revert
```bash
# Undo last commit (keep changes)
git reset HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Create new commit that undoes previous commit
git revert commit-hash
```

### Tags
```bash
# Create tag
git tag v1.0.0

# Push tags
git push origin --tags

# List tags
git tag -l
```

---

## 9. Best Practices

### Commit Messages
```bash
# Good commit messages:
git commit -m "Add user authentication feature"
git commit -m "Fix memory leak in image processing"
git commit -m "Update documentation for API endpoints"

# Bad commit messages:
git commit -m "fix"
git commit -m "changes"
git commit -m "asdf"
```

### Commit Message Format
```
type(scope): description

body (optional)

footer (optional)
```

Example:
```
feat(auth): add password reset functionality

Allow users to reset their password via email link.
Includes email template and security token validation.

Closes #123
```

### Branch Naming
```bash
# Good branch names:
feature/user-authentication
bugfix/memory-leak-fix
hotfix/security-patch

# Bad branch names:
test
fix
branch1
```

### .gitignore
Create `.gitignore` file to exclude files:
```gitignore
# Dependencies
node_modules/
*.log

# Build output
dist/
build/

# Environment variables
.env

# IDE files
.vscode/
.idea/
```

---

## 10. Expert-Level Topics

### Git Hooks
```bash
# Pre-commit hook example
#!/bin/sh
# .git/hooks/pre-commit
npm run lint
npm test
```

### Submodules
```bash
# Add submodule
git submodule add https://github.com/user/repo.git path/to/submodule

# Clone repository with submodules
git clone --recursive https://github.com/user/repo.git
```

### Git Worktrees
```bash
# Create new worktree
git worktree add -b feature-branch ../feature-work

# List worktrees
git worktree list
```

### Bisect (Finding Bugs)
```bash
# Start bisect
git bisect start
git bisect bad          # Current commit is bad
git bisect good v1.0    # v1.0 was good

# Git will checkout commits for you to test
# Mark each as good or bad until bug is found
git bisect good
git bisect bad

# End bisect
git bisect reset
```

### Advanced Rebase
```bash
# Squash commits
git rebase -i HEAD~3

# In editor, change 'pick' to 'squash' for commits to combine
```

---

## 11. Learning Path Recommendations

### Beginner (Week 1-2)
- [ ] Install Git and set up GitHub account
- [ ] Learn basic commands: `init`, `add`, `commit`, `status`, `log`
- [ ] Practice with local repositories
- [ ] Create your first GitHub repository

### Intermediate (Week 3-4)
- [ ] Master branching and merging
- [ ] Learn GitHub workflow (push, pull, clone)
- [ ] Practice collaboration with pull requests
- [ ] Understand `.gitignore` and commit best practices

### Advanced (Week 5-6)
- [ ] Learn rebasing and stashing
- [ ] Practice conflict resolution
- [ ] Explore GitHub features (issues, projects, actions)
- [ ] Set up Git hooks

### Expert (Ongoing)
- [ ] Master advanced Git commands
- [ ] Learn Git internals
- [ ] Automate workflows with GitHub Actions
- [ ] Contribute to open source projects

---

## 12. Practical Exercises

### Exercise 1: Personal Portfolio Repository
1. Create a repository for your personal portfolio
2. Add HTML, CSS, and JavaScript files
3. Use branches for different features
4. Deploy using GitHub Pages

### Exercise 2: Collaboration Project
1. Find a friend or join an open source project
2. Practice forking and pull requests
3. Resolve merge conflicts together
4. Use issues to track bugs and features

### Exercise 3: Git Workflow Simulation
1. Create a project with multiple contributors (use different folders as different users)
2. Practice different merge strategies
3. Simulate conflicts and resolve them
4. Use tags for releases

---

## 13. Additional Resources

### Documentation
- [Official Git Documentation](https://git-scm.com/doc)
- [GitHub Documentation](https://docs.github.com/)
- [Pro Git Book](https://git-scm.com/book) (Free)

### Interactive Learning
- [Learn Git Branching](https://learngitbranching.js.org/)
- [GitHub Learning Lab](https://lab.github.com/)
- [Codecademy Git Course](https://www.codecademy.com/learn/learn-git)

### Cheat Sheets
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)

### Command Quick Reference

#### Essential Commands
```bash
git init                    # Initialize repository
git clone <url>            # Clone repository
git status                 # Check status
git add <file>             # Stage file
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote
```

#### Branch Commands
```bash
git branch                 # List branches
git checkout -b <branch>   # Create and switch branch
git switch <branch>        # Switch branch
git merge <branch>         # Merge branch
git branch -d <branch>     # Delete branch
```

#### History and Inspection
```bash
git log                    # View commit history
git log --oneline          # Compact history
git diff                   # See changes
git show <commit>          # Show commit details
```

---

## 🎯 Next Steps

1. **Start with the basics**: Install Git and create your first repository
2. **Practice daily**: Make commits to personal projects
3. **Join the community**: Contribute to open source projects
4. **Build your profile**: Create an impressive GitHub profile
5. **Keep learning**: Git has many advanced features to explore

Remember: Git mastery comes with practice. Start small, be consistent, and gradually work your way up to more complex workflows.

---

*Happy coding! 🚀* 