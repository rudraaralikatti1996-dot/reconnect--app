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
                        rsync -a \
                            --exclude='node_modules' \
                            --exclude='.env' \
                            "$WORKSPACE/api/" "$TEST_DIR/"

                        echo "Running automated API tests..."

                        docker run --rm \
                            --user "$(id -u):$(id -g)" \
                            --network reconnect-app_default \
                            -e DB_HOST=postgres-db \
                            -e DB_PORT=5432 \
                            -e DB_USER="$DB_USER" \
                            -e DB_PASSWORD="$DB_PASSWORD" \
                            -e DB_NAME=reconnectdb \
                            -v "$TEST_DIR:/app" \
                            -w /app \
                            node:22-alpine \
sh -c "npm ci --cache /app/.npm-cache && npm test"
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('api') {
                    sh '''
                        set -e

                        IMAGE_TAG=$(git rev-parse --short HEAD)

                        echo "Git commit: $IMAGE_TAG"

                        echo "Building Reconnect API Docker image..."

                        docker build \
                            -t reconnect-api:$IMAGE_TAG \
                            .

                        echo "Docker image build successful!"
                        echo "Docker image: reconnect-api:$IMAGE_TAG"
                    '''
                }
            }
        }

        stage('Test Docker Image') {
            steps {
                sh '''
                    set -e

                    IMAGE_TAG=$(git rev-parse --short HEAD)

                    echo "Git commit: $IMAGE_TAG"

                    echo "Starting Docker container for testing..."

                    docker run -d \
                        --name reconnect-api-test \
                        -p 3001:3000 \
                        reconnect-api:$IMAGE_TAG

                    echo "Waiting for application to start..."

                    sleep 5

                    echo "Testing Reconnect API..."

                    curl -f http://localhost:3001

                    echo ""
                    echo "Docker image test successful!"
                '''
            }

            post {
                always {
                    sh '''
                        echo "Cleaning up test container..."

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
                        set -e

                        IMAGE_TAG=$(git rev-parse --short HEAD)

                        echo "Git commit: $IMAGE_TAG"

                        echo "Logging in to Docker Hub..."

                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USERNAME" \
                            --password-stdin

                        echo "Tagging Docker image..."

                        docker tag \
                            reconnect-api:$IMAGE_TAG \
                            "$DOCKER_USERNAME/reconnect-api:$IMAGE_TAG"

                        echo "Pushing Docker image..."

                        docker push \
                            "$DOCKER_USERNAME/reconnect-api:$IMAGE_TAG"

                        echo "Docker image pushed successfully!"

                        docker logout
                    '''
                }
            }
        }

stage('Deploy') {
    steps {
        sh '''
            set -e

            APP_DIR="/home/ubuntu/reconnect-app"
            COMPOSE_FILE="$APP_DIR/docker-compose.yml"

            IMAGE_TAG=$(git rev-parse --short HEAD)

            echo "========================================="
            echo "Reconnect Application Deployment"
            echo "========================================="

            echo "New Git commit: $IMAGE_TAG"

            echo ""
            echo "Detecting currently running API image..."

            CURRENT_IMAGE=$(docker inspect \
                --format='{{.Config.Image}}' \
                reconnect-api)

            PREVIOUS_TAG="${CURRENT_IMAGE##*:}"

            echo "Current running image: $CURRENT_IMAGE"
            echo "Previous image tag: $PREVIOUS_TAG"
            echo "New image tag: $IMAGE_TAG"

            echo ""
            echo "Pulling new Docker image..."

            IMAGE_TAG="$IMAGE_TAG" docker compose \
                -f "$COMPOSE_FILE" \
                pull api

            echo ""
            echo "Deploying new version..."

            if ! IMAGE_TAG="$IMAGE_TAG" docker compose \
                -f "$COMPOSE_FILE" \
                up -d; then

                echo ""
                echo "ERROR: Docker Compose deployment failed."
                echo "Starting rollback to: $PREVIOUS_TAG"

                "$APP_DIR/rollback.sh" "$PREVIOUS_TAG"

                exit 1
            fi

            echo ""
            echo "Waiting for API container to become healthy..."

            MAX_ATTEMPTS=12
            ATTEMPT=1
            HEALTHY=false

            while [ "$ATTEMPT" -le "$MAX_ATTEMPTS" ]; do

                STATUS=$(docker inspect \
                    --format='{{.State.Health.Status}}' \
                    reconnect-api 2>/dev/null || echo "missing")

                echo "Health check $ATTEMPT/$MAX_ATTEMPTS: $STATUS"

                if [ "$STATUS" = "healthy" ]; then
                    HEALTHY=true
                    break
                fi

                if [ "$STATUS" = "unhealthy" ]; then
                    break
                fi

                sleep 5
                ATTEMPT=$((ATTEMPT + 1))
            done

            if [ "$HEALTHY" != "true" ]; then

                echo ""
                echo "========================================="
                echo "DEPLOYMENT FAILED"
                echo "========================================="

                echo "New image $IMAGE_TAG failed health check."
                echo "Rolling back to previous version: $PREVIOUS_TAG"

                "$APP_DIR/rollback.sh" "$PREVIOUS_TAG"

                echo ""
                echo "Rollback completed."
                echo "Previous version restored: $PREVIOUS_TAG"

                echo ""
                echo "The Jenkins pipeline will be marked FAILED."
                echo "The application has been restored successfully."

                exit 1
            fi

 echo ""
            echo "Testing deployed API endpoint..."

            if ! curl -f http://localhost:3000; then

                echo ""
                echo "========================================="
                echo "API ENDPOINT TEST FAILED"
                echo "========================================="

                echo "New image $IMAGE_TAG is not responding correctly."
                echo "Rolling back to previous version: $PREVIOUS_TAG"

                "$APP_DIR/rollback.sh" "$PREVIOUS_TAG"

                echo ""
                echo "Rollback completed."
                echo "Previous version restored: $PREVIOUS_TAG"

                exit 1
            fi

            echo ""
            echo "========================================="
            echo "Deployment completed successfully!"
            echo "========================================="

            echo "Deployed image: $IMAGE_TAG"
            echo "API container: healthy"
            echo "API endpoint: responding"
        '''
    }
  }
}
    post {
        success {
            echo '========================================='
            echo 'Reconnect App CI/CD Pipeline SUCCESSFUL!'
            echo '========================================='
        }

        failure {
            echo '========================================='
            echo 'Reconnect App CI/CD Pipeline FAILED!'
            echo 'Check the failed stage and Jenkins console output.'
            echo '========================================='
        }

        always {
            echo 'Pipeline execution completed.'
        }
    }
}

