pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                sh 'git pull origin main'
            }
        }

        stage('OWASP Dependency-Check') {
            steps {
                dependencyCheck additionalArguments: '--scan ./ --format ALL --prettyPrint', 
                                odcInstallation: 'default'
            }
            post {
                always {
                    dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
                }
            }
        }
        
        stage('Build') {
            steps {
                sh 'docker build --pull --rm -f "Dockerfile" -t blog:latest "."'
            }
        }

        stage('Trivy') {
            steps {
                sh 'docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL blog:latest'
            }
        }

        stage('Run') {
            steps {
                sh 'docker stop blog || true'
                sh 'docker rm blog || true'
                sh 'docker run -d -p 3000:3000 --name blog blog'
                sleep 5
            }
        }

        stage('Nikto') {
            steps {
                sh 'docker run --rm --network host hackllc/nikto:sha-e108110  -h http://127.0.0.1:3000 || true'
            }
        }
    }
}