# WDD 130 Project
This is the starting repository for Brother Keers' WDD 130 class.

## Installation
Before you can start using this repository for your project you need to complete the following steps:

0. Create a GitHub account if you do not have one; you get a pro account for free as a student, just use your student email. Next you will need to make sure you have git installed on your computer. If you do not have git download and install it.
1. Create your own repository online with GitHub.
2. Clone your new repository to your computer, add a README, and push the change back to GitHub.
3. Download a copy of this repositories code to your computer and then paste it into your cloned repository. Push these changes up to GitHub.
4. Start working on your website and don't forget to push up your changes (progress) often.

This is an easy way to get going with this project. If you are already familiar with git and GitHub you can ignore these steps and use your own workflow. If this is all brand new to you please follow the following steps below:

## 0:
You need a GitHub account for this project. If you have one already you do not need to create a new one, use your existing account. As a student you qualify for free access to GitHub Pro so signup with your student email. If you have an account already and want Pro for free you can link your student email to your existing account.

Next lets check if you have git installed. In your terminal (command line) run this command:

```
git --version
```

If you get an error or any other message than the installed git version you need to [visit this site](https://git-scm.com/downloads) and install git before continuing.

## 1:
Follow [these instructions](https://docs.github.com/en/free-pro-team@latest/github/getting-started-with-github/create-a-repo) to create a new repository. Please make the following adjustments when creating your repository:

- Name your reposirty: wdd-130-[Your Lowercase Last Name Here] --> Example: wdd-130-keers
- Do not initialize your repository with a README; I have one for you already. If you accidentally did just replace it later.
- Do not follow the instructions to try your first commit. These instructions are for online edits to your repository but we will do all our edits locally on your own computer.
- You can add a license file. Choose MIT.

## 2:
Follow [these instructions](https://docs.github.com/en/free-pro-team@latest/github/creating-cloning-and-archiving-repositories/cloning-a-repository) to clone your new repository to your computer. Please keep the following in mind:

- I use SSH but HTTPS is easier if your new to GitHub; if you choose to go the SSH route your on your own.
- You may need to follow the Cloning an empty repository instructions.
- Do not use GitHub Desktop. Ignore any instructions that try to teach you that.
- When you run the git clone command in your terminal (command line) the files will be copied to that location. Make sure your in the location you want the files to be in.

Now in the folder you just cloned make a new file called `README.md` and add the following:

```
# [First Name Last Name]
```

md stands for markdown. Markdown is a style of marking a file in a simplified way that can be converted by a markdown reader into a semi-styled HTML page. We made this file so you could test pushing a change up to GitHub. Before we can push something back to GitHub we need to attach our credentials to the repository. If you only have one GitHub account the easy way is to run these commands replaced with your information:

```
git config --global user.name "Your Name"
git config --global user.email "Your Email Address With GitHub"
```

If your like me and have lots of GitHub accounts and/or use SSH you'll probably want to add your credentals locally. This means only this repository will use these credentails, they will not be auto applied to every git repo you have. Make sure to replace the command with your information:

```
git config --local user.name "Your Name"
git config --local user.email "Your Email Address With GitHub"
```

Now in your terminal push the change back to GitHub:

```
git add .
git commit -m "Testing a git push."
git push
```
**NOTE**: If you get a warning that you need to initalize your repository (init) your in the wrong folder! Don't forget to step inside (cd into) your repositories folder.

If you need help pushing your changes follow [these instructions](https://docs.github.com/en/free-pro-team@latest/github/using-git/pushing-commits-to-a-remote-repository).

## 3:
Now download a copy of [this repository](https://github.com/caboodle-tech/wdd-130-project). Way at the top of this page is a green button, click on that and then choose download zip from the options.

Unzip (unpack) this code into your own repository. Add all the files via got, and then commit the changes up to GitHub:

```
git add .
git commit -m "Adding base project files."
git push
```

## 4:
Start working on your project! Your [instructions are here](docs/instructions.md) and the [grading criteria is here](docs/grading.md).
