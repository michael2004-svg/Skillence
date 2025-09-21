// Initialize Supabase client (assumed to be global from core.js)
const supabase = window.supabaseClient;

function setStatus(message, type = 'info', duration = 5000) {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `status-message show status-${type}`;
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, duration);
}

async function getUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
}

async function calculateSkillScore(cvData, profileData) {
    let score = 0;

    // Skills (50% of score)
    const cvSkills = cvData?.skills || [];
    const profileSkills = profileData?.top_skills || [];
    const uniqueSkills = [...new Set([...cvSkills, ...profileSkills])];
    score += Math.min(uniqueSkills.length * 5, 50); // Max 50 points for up to 10 skills

    // Experience Level (30% of score)
    const experienceLevel = profileData?.experience_level?.toLowerCase();
    if (experienceLevel === 'expert') score += 30;
    else if (experienceLevel === 'intermediate') score += 20;
    else if (experienceLevel === 'beginner') score += 10;

    // Industry Match (20% of score)
    const cvIndustry = cvData?.industry?.toLowerCase();
    const profileIndustry = profileData?.industry?.toLowerCase();
    if (cvIndustry && profileIndustry && cvIndustry === profileIndustry) {
        score += 20;
    }

    // Normalize to 0-100
    score = Math.min(Math.max(Math.round(score), 0), 100);
    return score;
}

async function storeSkillScore(userId, score) {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ skill_score: score })
            .eq('id', userId);
        if (error) throw error;
        console.log('Skill score stored:', score);
    } catch (error) {
        console.error('Error storing skill score:', error);
        setStatus(`Failed to store skill score: ${error.message}`, 'error');
    }
}

// CVAnalyzer Class
class CVAnalyzer {
    constructor() {
        this.industryKeywords = {
            'technology': ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'kubernetes', 'api', 'database', 'agile', 'scrum', 'git', 'ci/cd', 'microservices', 'cloud computing', 'machine learning', 'ai', 'data science'],
            'marketing': ['seo', 'sem', 'google analytics', 'social media', 'content marketing', 'email marketing', 'conversion optimization', 'brand management', 'campaign management', 'roi', 'kpi', 'a/b testing', 'digital marketing', 'ppc'],
            'finance': ['financial analysis', 'budgeting', 'forecasting', 'risk management', 'compliance', 'audit', 'excel', 'financial modeling', 'treasury', 'accounting', 'ifrs', 'gaap', 'investment', 'portfolio management'],
            'sales': ['crm', 'lead generation', 'sales funnel', 'negotiation', 'client relationship', 'revenue growth', 'quota achievement', 'prospecting', 'closing', 'account management', 'b2b', 'b2c', 'pipeline management'],
            'healthcare': ['patient care', 'medical records', 'hipaa', 'clinical research', 'regulatory compliance', 'medical terminology', 'patient safety', 'quality improvement', 'emr', 'telemedicine', 'evidence-based practice'],
            'education': ['curriculum development', 'lesson planning', 'student assessment', 'classroom management', 'educational technology', 'differentiated instruction', 'learning outcomes', 'pedagogy', 'student engagement']
        };

        this.hrOptimizationTips = {
            'ats_friendly': [
                'Use standard section headers (Experience, Education, Skills)',
                'Include relevant keywords from job description',
                'Use simple, clean formatting',
                'Save in multiple formats (PDF and Word)',
                'Avoid graphics, tables, and complex layouts',
                'Use standard fonts (Arial, Calibri, Times New Roman)'
            ],
            'content_optimization': [
                'Use action verbs to start bullet points',
                'Quantify achievements with numbers and percentages',
                'Tailor content to specific job requirements',
                'Include industry-specific keywords',
                'Show progression and growth',
                'Focus on results and impact'
            ]
        };

        this.actionVerbs = [
            'achieved', 'administered', 'analyzed', 'built', 'collaborated', 'coordinated',
            'created', 'delivered', 'developed', 'enhanced', 'executed', 'generated',
            'implemented', 'improved', 'increased', 'launched', 'led', 'managed',
            'optimized', 'organized', 'produced', 'reduced', 'streamlined', 'supervised'
        ];
    }

    async analyzeCVContent(cvText, jobDescription = '') {
        const analysis = {
            timestamp: new Date().toISOString(),
            overallScore: 0,
            sections: this.analyzeSections(cvText),
            keywords: await this.analyzeKeywords(cvText, jobDescription),
            recommendations: [],
            hrOptimization: this.getHROptimizationTips(cvText),
            industryMatch: this.detectIndustry(cvText),
            experienceLevel: this.assessExperienceLevel(cvText),
            skillsAnalysis: this.analyzeSkills(cvText),
            formatAnalysis: this.analyzeFormat(cvText)
        };

        analysis.recommendations = this.generateRecommendations(analysis);
        analysis.overallScore = this.calculateOverallScore(analysis);
        return analysis;
    }

    analyzeSections(cvText) {
        const sections = {
            contactInfo: this.findContactInfo(cvText),
            summary: this.findSummary(cvText),
            experience: this.findExperience(cvText),
            education: this.findEducation(cvText),
            skills: this.findSkills(cvText),
            certifications: this.findCertifications(cvText)
        };
        return {
            present: Object.keys(sections).filter(key => sections[key].found),
            missing: Object.keys(sections).filter(key => !sections[key].found),
            details: sections
        };
    }

    findContactInfo(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const phoneRegex = /[\+]?[1-9]?[\d\s\-\(\)]{10,}/;
        const linkedinRegex = /linkedin\.com\/in\/[\w\-]+/i;
        return {
            found: emailRegex.test(text) && phoneRegex.test(text),
            email: emailRegex.test(text),
            phone: phoneRegex.test(text),
            linkedin: linkedinRegex.test(text),
            score: (emailRegex.test(text) ? 40 : 0) + 
                   (phoneRegex.test(text) ? 40 : 0) + 
                   (linkedinRegex.test(text) ? 20 : 0)
        };
    }

    findSummary(text) {
        const summaryKeywords = ['summary', 'profile', 'about', 'overview', 'objective'];
        const hasSummary = summaryKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        return {
            found: hasSummary,
            score: hasSummary ? 80 : 0
        };
    }

    findExperience(text) {
        const experienceKeywords = ['experience', 'employment', 'work history', 'career'];
        const hasExperience = experienceKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        const yearPattern = /\b(19|20)\d{2}\b/g;
        const years = text.match(yearPattern) || [];
        return {
            found: hasExperience || years.length >= 2,
            yearsFound: years.length,
            score: hasExperience ? 90 : (years.length >= 2 ? 70 : 0)
        };
    }

    findEducation(text) {
        const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd'];
        const hasEducation = educationKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        return {
            found: hasEducation,
            score: hasEducation ? 75 : 0
        };
    }

    findSkills(text) {
        const skillsKeywords = ['skills', 'competencies', 'technologies', 'tools'];
        const hasSkillsSection = skillsKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        return {
            found: hasSkillsSection,
            score: hasSkillsSection ? 85 : 0
        };
    }

    findCertifications(text) {
        const certKeywords = ['certification', 'certificate', 'certified', 'license'];
        const hasCertifications = certKeywords.some(keyword => 
            text.toLowerCase().includes(keyword.toLowerCase())
        );
        return {
            found: hasCertifications,
            score: hasCertifications ? 70 : 0
        };
    }

    async analyzeKeywords(cvText, jobDescription) {
        const cvKeywords = this.extractKeywords(cvText.toLowerCase());
        const jobKeywords = jobDescription ? this.extractKeywords(jobDescription.toLowerCase()) : [];
        let matchedKeywords = cvKeywords.filter(keyword => jobKeywords.includes(keyword));
        let matchPercentage = jobKeywords.length > 0 ? (matchedKeywords.length / jobKeywords.length) * 100 : 0;
        return {
            cvKeywords,
            jobKeywords,
            matchedKeywords,
            matchPercentage: Math.round(matchPercentage),
            missingKeywords: jobKeywords.filter(keyword => !matchedKeywords.includes(keyword))
        };
    }

    extractKeywords(text) {
        const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
        const frequency = {};
        words.forEach(word => {
            if (word.length > 2 && !this.isCommonWord(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        return Object.keys(frequency)
            .filter(word => frequency[word] >= 2)
            .sort((a, b) => frequency[b] - frequency[a])
            .slice(0, 20);
    }

    isCommonWord(word) {
        const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'has', 'let', 'put', 'say', 'she', 'too', 'use'];
        return commonWords.includes(word.toLowerCase());
    }

    detectIndustry(text) {
        const textLower = text.toLowerCase();
        const industryScores = {};
        Object.keys(this.industryKeywords).forEach(industry => {
            let score = 0;
            this.industryKeywords[industry].forEach(keyword => {
                if (textLower.includes(keyword.toLowerCase())) {
                    score++;
                }
            });
            industryScores[industry] = score;
        });
        const detectedIndustry = Object.keys(industryScores).reduce((a, b) => 
            industryScores[a] > industryScores[b] ? a : b
        );
        return {
            industry: detectedIndustry,
            confidence: Math.min((industryScores[detectedIndustry] / this.industryKeywords[detectedIndustry].length) * 100, 100),
            allScores: industryScores
        };
    }

    assessExperienceLevel(text) {
        const yearPattern = /\b(19|20)\d{2}\b/g;
        const years = text.match(yearPattern) || [];
        const currentYear = new Date().getFullYear();
        let experienceYears = 0;
        if (years.length >= 2) {
            const sortedYears = years.map(Number).sort();
            experienceYears = currentYear - Math.min(...sortedYears);
        }
        let level = 'entry';
        if (experienceYears > 10) level = 'senior';
        else if (experienceYears > 5) level = 'mid';
        else if (experienceYears > 2) level = 'junior';
        return {
            level: level,
            estimatedYears: experienceYears,
            yearsFound: years
        };
    }

    analyzeSkills(text) {
        const textLower = text.toLowerCase();
        const foundSkills = [];
        Object.values(this.industryKeywords).flat().forEach(skill => {
            if (textLower.includes(skill.toLowerCase())) {
                foundSkills.push(skill);
            }
        });
        return {
            totalSkills: foundSkills.length,
            skills: foundSkills,
            technicalSkills: foundSkills.filter(skill => 
                this.industryKeywords.technology.includes(skill)
            ),
            softSkillsPresent: this.checkSoftSkills(textLower)
        };
    }

    checkSoftSkills(text) {
        const softSkills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'organized', 'detail-oriented', 'motivated', 'collaborative'];
        return softSkills.filter(skill => text.includes(skill.toLowerCase()));
    }

    analyzeFormat(text) {
        const issues = [];
        const suggestions = [];
        const hasActionVerbs = this.actionVerbs.some(verb => 
            text.toLowerCase().includes(verb)
        );
        if (!hasActionVerbs) {
            issues.push('Lacks strong action verbs');
            suggestions.push('Start bullet points with action verbs like "achieved", "developed", "managed"');
        }
        const hasNumbers = /\d+%|\d+\$|\d+,\d+|\d+ million|\d+ thousand/i.test(text);
        if (!hasNumbers) {
            issues.push('Missing quantifiable achievements');
            suggestions.push('Add numbers, percentages, and metrics to show impact');
        }
        const wordCount = text.split(/\s+/).length;
        if (wordCount < 200) {
            issues.push('CV appears too short');
            suggestions.push('Expand on your experiences and achievements');
        } else if (wordCount > 800) {
            issues.push('CV might be too long');
            suggestions.push('Consider condensing to 1-2 pages');
        }
        return {
            wordCount: wordCount,
            issues: issues,
            suggestions: suggestions,
            score: Math.max(100 - (issues.length * 15), 0)
        };
    }

    getHROptimizationTips(text) {
        const tips = [];
        tips.push(...this.hrOptimizationTips.ats_friendly.map(tip => ({
            category: 'ATS Optimization',
            tip: tip,
            priority: 'high'
        })));
        tips.push(...this.hrOptimizationTips.content_optimization.map(tip => ({
            category: 'Content Optimization',
            tip: tip,
            priority: 'medium'
        })));
        return tips;
    }

    calculateOverallScore(analysis) {
        const weights = {
            sections: 0.25,
            keywords: 0.20,
            format: 0.20,
            skills: 0.15,
            hrOptimization: 0.20
        };
        const sectionsScore = (analysis.sections.present.length / 6) * 100;
        const keywordsScore = analysis.keywords.matchPercentage;
        const formatScore = analysis.formatAnalysis.score;
        const skillsScore = Math.min(analysis.skillsAnalysis.totalSkills * 5, 100);
        const hrScore = 75;
        return Math.round(
            sectionsScore * weights.sections +
            keywordsScore * weights.keywords +
            formatScore * weights.format +
            skillsScore * weights.skills +
            hrScore * weights.hrOptimization
        );
    }

    generateRecommendations(analysis) {
        const recommendations = [];
        if (!analysis.sections.present.includes('contactInfo')) {
            recommendations.push({
                type: 'critical',
                category: 'Contact Information',
                message: 'Add complete contact information including email, phone, and LinkedIn profile'
            });
        }
        if (!analysis.sections.present.includes('summary')) {
            recommendations.push({
                type: 'high',
                category: 'Professional Summary',
                message: 'Add a compelling professional summary to grab HR attention immediately'
            });
        }
        if (analysis.keywords.matchPercentage < 60) {
            recommendations.push({
                type: 'high',
                category: 'Keywords',
                message: `Improve keyword match rate. Currently at ${analysis.keywords.matchPercentage}%. Add: ${analysis.keywords.missingKeywords.slice(0, 5).join(', ')}`
            });
        }
        if (analysis.industryMatch.confidence < 70) {
            recommendations.push({
                type: 'medium',
                category: 'Industry Focus',
                message: `Strengthen industry relevance. Add more ${analysis.industryMatch.industry} specific keywords and experiences`
            });
        }
        if (analysis.skillsAnalysis.totalSkills < 10) {
            recommendations.push({
                type: 'medium',
                category: 'Skills Section',
                message: 'Expand your skills section. Add both technical and soft skills relevant to your target role'
            });
        }
        analysis.formatAnalysis.suggestions.forEach(suggestion => {
            recommendations.push({
                type: 'medium',
                category: 'Formatting',
                message: suggestion
            });
        });
        return recommendations;
    }
}

// Initialize CVAnalyzer
const cvAnalyzer = new CVAnalyzer();

// DOM Elements
const cvScoreElement = document.getElementById('cv-score');
const cvScoreProgress = document.getElementById('cv-score-progress');
const cvIndustryElement = document.getElementById('cv-industry');
const cvSkillsElement = document.getElementById('cv-skills');
const cvTimestampElement = document.getElementById('cv-timestamp');

// Save CV Analysis
async function saveCVAnalysis(analysis, cvText, fileName) {
    try {
        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to save CV analysis.', 'error');
            return;
        }

        const { error } = await supabase
            .from('cv_analysis')
            .insert({
                user_id: userId,
                score: analysis.overallScore,
                industry: analysis.industryMatch.industry,
                skills: analysis.skillsAnalysis.skills,
                timestamp: analysis.timestamp,
                cv_text: cvText,
                file_name: fileName,
                analysis_data: analysis
            });

        if (error) throw error;

        // Update user_interests
        const interestsToAdd = [
            analysis.industryMatch.industry.toLowerCase(),
            ...analysis.skillsAnalysis.skills.slice(0, 5)
        ].filter(v => v);
        await supabase
            .from('user_interests')
            .upsert(
                interestsToAdd.map(interest => ({ user_id: userId, interest: interest.toLowerCase() })),
                { onConflict: ['user_id', 'interest'] }
            );

        setStatus('CV analysis saved successfully!', 'success');
        updateProfileWithCVData();
    } catch (error) {
        console.error('Error saving CV analysis:', error);
        setStatus(`Failed to save CV analysis: ${error.message}`, 'error');
    }
}

// Extract Text from CV File
async function extractTextFromFile(file) {
    if (file.type === 'application/pdf') {
        if (!window.pdfjsLib) {
            setStatus('PDF processing library failed to load.', 'error');
            throw new Error('pdf.js library not loaded');
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map(item => item.str).join(' ') + '\n';
            }
            return text;
        } catch (error) {
            setStatus(`Failed to process PDF: ${error.message}`, 'error');
            throw error;
        }
    } else {
        setStatus('Only PDF files are supported for now.', 'error');
        throw new Error('Unsupported file format');
    }
}

// CV Upload and Analysis
async function uploadCV() {
    const cvUpload = document.getElementById('cvUpload');
    const result = document.getElementById('result');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const btnText = document.getElementById('btnText');

    if (!cvUpload.files.length) {
        result.textContent = "Please select a file to upload.";
        setStatus('No file selected.', 'error');
        return;
    }

    try {
        result.textContent = `Analyzing ${cvUpload.files[0].name}...`;
        if (loadingSpinner) loadingSpinner.style.display = 'inline-flex';
        if (btnText) btnText.style.display = 'none';

        const file = cvUpload.files[0];
        const cvText = await extractTextFromFile(file);
        const analysis = await cvAnalyzer.analyzeCVContent(cvText);

        const userId = await getUserId();
        if (!userId) {
            setStatus('Please sign in to analyze CV.', 'error');
            return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('job_title, industry, experience_level, top_skills')
            .eq('id', userId)
            .single();
        if (profileError) throw profileError;

        // Calculate skill score
        const skillScore = await calculateSkillScore({
            skills: analysis.skillsAnalysis.skills,
            industry: analysis.industryMatch.industry
        }, profileData);

        // Store skill score
        await storeSkillScore(userId, skillScore);

        // Save CV analysis
        await saveCVAnalysis(analysis, cvText, file.name);

        // Display results
        updateAnalysisResults(analysis);
        setStatus('CV analysis complete!', 'success');
    } catch (error) {
        console.error('Error analyzing CV:', error);
        result.textContent = 'Failed to analyze CV.';
        setStatus(`Failed to analyze CV: ${error.message}`, 'error');
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (btnText) btnText.style.display = 'inline';
    }
}

// Update Analysis Results
function updateAnalysisResults(analysis) {
    const resultContainer = document.getElementById('result');
    if (!resultContainer) {
        setStatus('Error: Results container not found', 'error');
        return;
    }

    resultContainer.innerHTML = `
        <div class="result-header">
            <h3 class="result-title">CV Analysis Results</h3>
            <p class="result-subtitle">Here's what we found in your CV</p>
        </div>
        <div class="score-section">
            <div class="score-circle">
                <span class="score-value">${analysis.overallScore || 0}</span>
            </div>
            <div class="score-label">Overall CV Score</div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${analysis.overallScore || 0}%"></div>
            </div>
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">✓</div> Strengths</h4>
            ${analysis.sections?.present?.map(section => `
                <div class="analysis-item positive">
                    <div class="analysis-text">${section.charAt(0).toUpperCase() + section.slice(1)} section is well-structured</div>
                </div>
            `).join('') || '<div class="analysis-item">No strengths identified</div>'}
            ${analysis.skillsAnalysis?.skills?.length > 5 ? `
                <div class="analysis-item positive">
                    <div class="analysis-text">Strong skills section with ${analysis.skillsAnalysis.skills.length} relevant skills</div>
                </div>
            ` : ''}
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">⚠</div> Areas for Improvement</h4>
            ${analysis.sections?.missing?.map(section => `
                <div class="analysis-item negative">
                    <div class="analysis-text">Missing ${section.charAt(0).toUpperCase() + section.slice(1)} section</div>
                </div>
            `).join('') || '<div class="analysis-item">No missing sections</div>'}
            ${analysis.keywords?.matchPercentage < 60 ? `
                <div class="analysis-item negative">
                    <div class="analysis-text">Low keyword match rate (${analysis.keywords.matchPercentage}%). Add: ${analysis.keywords.missingKeywords?.slice(0, 3).join(', ') || 'none'}</div>
                </div>
            ` : ''}
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">💡</div> Recommendations</h4>
            ${analysis.recommendations?.map(rec => `
                <div class="analysis-item ${rec.type || 'medium'}">
                    <div class="analysis-text">${rec.message || 'No message provided'}</div>
                </div>
            `).join('') || '<div class="analysis-item">No recommendations available</div>'}
        </div>
    `;
    resultContainer.classList.add('show');
}

// Initialize CV Upload
document.addEventListener('DOMContentLoaded', () => {
    const uploadContainer = document.getElementById('uploadContainer');
    if (uploadContainer) {
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadContainer.classList.add('dragover');
        });
        uploadContainer.addEventListener('dragleave', () => {
            uploadContainer.classList.remove('dragover');
        });
        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                document.getElementById('cvUpload').files = files;
                document.getElementById('analyzeBtn').disabled = false;
                uploadCV();
            }
        });
    }

    const cvUpload = document.getElementById('cvUpload');
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (cvUpload) {
        cvUpload.addEventListener('change', () => {
            const fileInfo = document.getElementById('fileInfo');
            const fileName = document.getElementById('fileName');
            const fileSize = document.getElementById('fileSize');
            const fileType = document.getElementById('fileType');

            if (cvUpload.files.length > 0) {
                const file = cvUpload.files[0];
                fileName.textContent = file.name;
                fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
                fileType.textContent = `Type: ${file.type}`;
                fileInfo.style.display = 'block';
                analyzeBtn.disabled = false;
            } else {
                fileInfo.style.display = 'none';
                analyzeBtn.disabled = true;
            }
        });
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', uploadCV);
    }

    updateProfileWithCVData();
});