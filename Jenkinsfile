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

        stage('Automated API Tests') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'reconnect-db-credentials',
                        usernameVariable: 'DB_USER',
                        passwordVariable: 'DB_PASSWORD'
                    )
                ]) {
                    sh '''
                        set -e

                        TEST_DIR=$(mktemp -d)

                        cleanup() {
                            rm -rf "$TEST_DIR"
                        }

                        trap cleanup EXIT

                        echo "Creating isolated test workspace..."
                        cp -R "$WORKSPACE/api/." "$TEST_DIR/"

                        echo "Running automated API tests..."

                        docker run --rm \
                            --network reconnect-app_default \
                            -e DB_HOST=postgres-db \
                            -e DB_PORT=5432 \
                            -e DB_USER="$DB_USER" \
                            -e DB_PASSWORD="$DB_PASSWORD" \
                            -e DB_NAME=reconnectdb \
                            -v "$TEST_DIR:/app" \
                            -w /app \
                            node:22-alpine \
                            sh -c "npm ci && npm test"
                    '''
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

        stage('Deploy') {
            steps {
                sh '''
                    IMAGE_TAG=$BUILD_NUMBER docker compose \
                        -f /home/ubuntu/reconnect-app/docker-compose.yml \
                        pull api

                    IMAGE_TAG=$BUILD_NUMBER docker compose \
                        -f /home/ubuntu/reconnect-app/docker-compose.yml \
                        up -d
                '''
            }
        }
    }
}

