pipeline {
    agent any

    stages {

        stage('Welcome') {
            steps {
                echo 'Welcome to the Reconnect App CI Pipeline!'
            }
        }

        stage('System Information') {
            steps {
                sh 'pwd'
                sh 'whoami'
                sh 'hostname'
            }
        }

        stage('Check Git') {
            steps {
                sh 'git --version'
            }
        }

        stage('Check Docker') {
            steps {
                sh 'docker --version'
            }
        }
    }
}
