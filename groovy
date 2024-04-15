pipeline {
    agent any

    stages {
        stage('Build Docker image') {
            steps {
                script {
                    // Use the 'docker.build' step to build the Docker image
                    def dockerImage = docker.build('my-node-app', '-f Dockerfile .')
                }
            }
        }
        stage('Push Docker image') {
            steps {
                script {
                    // Use the 'docker.withRegistry' step to push the Docker image to a registry
                    docker.withRegistry('https://registry.example.com', 'credentials-id') {
                        dockerImage.push('latest')
                    }
                }
            }
        }
    }
}
