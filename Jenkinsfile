pipeline {
    agent any

    environment {
        REGISTRY = 'ghcr.io'
        IMAGE_NAME = 'second-brain-ai'
        NODE_VERSION = '20'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'npm ci'
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Lint & Type Check') {
            parallel {
                stage('ESLint') {
                    steps {
                        nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('TypeScript') {
                    steps {
                        nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                            sh 'npx tsc --noEmit'
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                nodejs(nodeJSInstallationName: "Node-${NODE_VERSION}") {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Push') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def gitSha = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def imageFull = "${REGISTRY}/${IMAGE_NAME}"

                    docker.withRegistry("https://${REGISTRY}", 'ghcr-credentials') {
                        def image = docker.build("${imageFull}:${gitSha}", '.')
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo 'Deploy step — configure for your environment:'
                    echo '  Option A: SSH + docker compose pull/up'
                    echo '  Option B: kubectl set image'
                    echo '  Option C: aws ecs update-service'
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
        success {
            echo 'Pipeline completed successfully.'
        }
    }
}
