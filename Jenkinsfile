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

        stage('Check Node') {
            steps {
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('api') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('api') {
                    sh '''
                        docker build \
                            -t reconnect-api:${BUILD_NUMBER} \
                            .
                    '''
                }
            }
        }

        stage('Test Docker Image') {
            steps {
                sh '''
                    docker run -d \
                        --name reconnect-api-test \
                        -p 3001:3000 \
                        reconnect-api:${BUILD_NUMBER}

                    sleep 5

                    curl -f http://localhost:3001
                '''
            }

            post {
                always {
                    sh '''
                        docker stop reconnect-api-test 2>/dev/null || true
                        docker rm reconnect-api-test 2>/dev/null || true
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USERNAME" \
                            --password-stdin

                        docker tag \
                            reconnect-api:${BUILD_NUMBER} \
                            "$DOCKER_USERNAME/reconnect-api:${BUILD_NUMBER}"

                        docker push \
                            "$DOCKER_USERNAME/reconnect-api:${BUILD_NUMBER}"

                        docker logout
                    '''
                }
            }
        }
    }
}
