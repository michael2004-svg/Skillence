// Initialize Supabase client
const supabase = window.supabase.createClient(
    'https://anzrbwcextohaatvwvvh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuenJid2NleHRvaGFhdHZ3dnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NjE2NDgsImV4cCI6MjA3MzIzNzY0OH0.DSJBwubiIAqEXDqVZMuJLUrsgY9vBKDQuPQBPIItHuw'
);

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

    analyzeCVContent(cvText, jobDescription = '') {
        const analysis = {
            timestamp: new Date().toISOString(),
            overallScore: 0,
            sections: this.analyzeSections(cvText),
            keywords: this.analyzeKeywords(cvText, jobDescription),
            recommendations: [],
            hrOptimization: this.getHROptimizationTips(cvText),
            industryMatch: this.detectIndustry(cvText),
            experienceLevel: this.assessExperienceLevel(cvText),
            skillsAnalysis: this.analyzeSkills(cvText),
            formatAnalysis: this.analyzeFormat(cvText)
        };

        analysis.overallScore = this.calculateOverallScore(analysis);
        analysis.recommendations = this.generateRecommendations(analysis);
        
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
        
        // AI-enhanced semantic matching
        let matchedKeywords = cvKeywords.filter(keyword => jobKeywords.includes(keyword));
        let matchPercentage = jobKeywords.length > 0 ? (matchedKeywords.length / jobKeywords.length) * 100 : 0;

        try {
            const response = await fetch('https://api.x.ai/grok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cvKeywords,
                    jobKeywords,
                    prompt: 'Perform semantic matching between CV and job description keywords. Return matched and missing keywords with similarity scores.'
                })
            });
            const aiMatches = await response.json();
            matchedKeywords = aiMatches.matched || matchedKeywords;
            matchPercentage = aiMatches.matchPercentage || matchPercentage;
        } catch (error) {
            console.warn('AI keyword matching failed, using default:', error);
        }

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

    // Updated generateRecommendations in CVAnalyzer
async generateRecommendations(analysis) {
    const recommendations = [];
    
    // Add default recommendations
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
            message: `Improve keyword match rate. Currently at ${analysis.keywords.matchPercentage}%. Add missing keywords: ${analysis.keywords.missingKeywords.slice(0, 5).join(', ')}`
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

    // AI-enhanced recommendations
    try {
        const response = await fetch('https://api.x.ai/grok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                analysis,
                prompt: 'Generate personalized CV improvement recommendations based on this analysis, target role, and industry trends.'
            })
        });
        const aiRecommendations = await response.json();
        // Ensure aiRecommendations is an array
        if (Array.isArray(aiRecommendations)) {
            recommendations.push(...aiRecommendations);
        } else {
            console.warn('AI recommendations invalid, received:', aiRecommendations);
        }
    } catch (error) {
        console.warn('AI recommendations failed, using default:', error);
    }
    
    // Ensure recommendations is always an array
    return Array.isArray(recommendations) ? recommendations : [];
}

    async generatePerfectCV(userInfo, targetRole = '', industry = '') {
        const template = {
            header: this.generateHeader(userInfo),
            professionalSummary: await this.generateSummary(userInfo, targetRole, industry),
            coreCompetencies: this.generateCoreCompetencies(industry),
            professionalExperience: this.generateExperience(userInfo, industry),
            education: this.generateEducation(userInfo),
            certifications: this.generateCertifications(userInfo),
            additionalSections: this.generateAdditionalSections(userInfo)
        };
        
        return {
            template: template,
            tips: this.getTemplateOptimizationTips(),
            formatting: this.getFormattingGuidelines()
        };
    }

    generateHeader(userInfo) {
        return {
            name: userInfo.name || '[Your Full Name]',
            title: userInfo.title || '[Professional Title]',
            phone: userInfo.phone || '[Phone Number]',
            email: userInfo.email || '[Professional Email]',
            linkedin: userInfo.linkedin || '[LinkedIn Profile URL]',
            location: userInfo.location || '[City, State]',
            website: userInfo.website || '[Portfolio Website (Optional)]'
        };
    }
async generateSummary(userInfo, targetRole, industry) {
        const templates = {
            technology: `Results-driven ${targetRole || 'Software Developer'} with ${userInfo.experience || 'X'} years of experience building scalable applications and leading technical initiatives. Proven track record of delivering high-quality solutions that drive business growth and improve user experience. Expertise in modern technologies and agile methodologies.`,
            marketing: `Strategic ${targetRole || 'Marketing Professional'} with ${userInfo.experience || 'X'} years of experience driving brand growth and customer engagement. Demonstrated success in developing and executing integrated marketing campaigns that increase revenue and market share. Strong analytical skills with expertise in digital marketing and data-driven decision making.`,
            finance: `Detail-oriented ${targetRole || 'Finance Professional'} with ${userInfo.experience || 'X'} years of experience in financial analysis, budgeting, and strategic planning. Proven ability to optimize financial performance and drive business growth through data-driven insights and process improvements.`,
            default: `Accomplished ${targetRole || 'Professional'} with ${userInfo.experience || 'X'} years of progressive experience in ${industry || 'the industry'}. Strong track record of achieving results, leading teams, and driving organizational success through strategic thinking and execution excellence.`
        };

        try {
            const response = await fetch('https://api.x.ai/grok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInfo,
                    targetRole,
                    industry,
                    prompt: `Generate a professional CV summary for a ${targetRole} in the ${industry} industry with ${userInfo.experience || 'X'} years of experience.`
                })
            });
            return (await response.json()).summary || templates[industry] || templates.default;
        } catch (error) {
            console.warn('AI summary generation failed, using default:', error);
            return templates[industry] || templates.default;
        }
    }

    generateCoreCompetencies(industry) {
        const competencies = {
            technology: [
                'Full-Stack Development', 'System Architecture', 'Database Design',
                'Cloud Computing (AWS/Azure)', 'DevOps & CI/CD', 'Agile/Scrum Methodologies',
                'API Development', 'Performance Optimization', 'Team Leadership'
            ],
            marketing: [
                'Digital Marketing Strategy', 'Content Marketing', 'SEO/SEM',
                'Social Media Marketing', 'Marketing Analytics', 'Campaign Management',
                'Brand Development', 'Market Research', 'Customer Engagement'
            ],
            finance: [
                'Financial Analysis', 'Budget Planning', 'Risk Management',
                'Financial Modeling', 'Regulatory Compliance', 'Investment Strategy',
                'Accounting Principles', 'Forecasting', 'Portfolio Management'
            ],
            sales: [
                'CRM Management', 'Lead Generation', 'Sales Strategy',
                'Client Relationship Management', 'Negotiation', 'Revenue Growth',
                'Pipeline Management', 'B2B/B2C Sales', 'Account Management'
            ],
            healthcare: [
                'Patient Care', 'Clinical Research', 'Regulatory Compliance',
                'Medical Records Management', 'Quality Improvement', 'HIPAA Compliance',
                'Telemedicine', 'Patient Safety', 'Evidence-Based Practice'
            ],
            education: [
                'Curriculum Development', 'Lesson Planning', 'Student Assessment',
                'Classroom Management', 'Educational Technology', 'Differentiated Instruction',
                'Learning Outcomes', 'Pedagogy', 'Student Engagement'
            ],
            default: [
                'Project Management', 'Team Leadership', 'Strategic Planning',
                'Problem Solving', 'Communication', 'Analytical Thinking',
                'Process Optimization', 'Stakeholder Management', 'Performance Metrics'
            ]
        };
        
        return competencies[industry] || competencies.default;
    }

    generateExperience(userInfo, industry) {
        const experienceTemplate = userInfo.experienceHistory?.map(exp => ({
            title: exp.title || '[Job Title]',
            company: exp.company || '[Company Name]',
            location: exp.location || '[City, State]',
            dates: `${exp.startDate || '[Start Date]'} - ${exp.endDate || 'Present'}`,
            achievements: exp.achievements?.map(ach => this.formatAchievement(ach, industry)) || [
                '[Quantifiable Achievement 1 using action verbs and metrics]',
                '[Quantifiable Achievement 2 demonstrating impact]',
                '[Quantifiable Achievement 3 showing progression]'
            ]
        })) || [{
            title: '[Job Title]',
            company: '[Company Name]',
            location: '[City, State]',
            dates: '[Start Date] - [End Date]',
            achievements: [
                'Led [project/initiative] resulting in [quantifiable outcome]',
                'Implemented [solution/process] improving [metric] by [percentage]',
                'Collaborated with [team/stakeholders] to achieve [goal]'
            ]
        }];

        return experienceTemplate;
    }

    formatAchievement(achievement, industry) {
        const actionVerb = this.actionVerbs[Math.floor(Math.random() * this.actionVerbs.length)];
        const industryKeywords = this.industryKeywords[industry] || this.industryKeywords.technology;
        const randomKeyword = industryKeywords[Math.floor(Math.random() * industryKeywords.length)];
        
        return achievement.includes('[Achievement]') 
            ? `${actionVerb.charAt(0).toUpperCase() + actionVerb.slice(1)} ${randomKeyword}-focused initiative resulting in measurable impact`
            : achievement;
    }

    generateEducation(userInfo) {
        return userInfo.education?.map(edu => ({
            degree: edu.degree || '[Degree, e.g., Bachelor of Science in Computer Science]',
            institution: edu.institution || '[University Name]',
            location: edu.location || '[City, State]',
            dates: edu.dates || '[Graduation Year]',
            honors: edu.honors || ''
        })) || [{
            degree: '[Degree]',
            institution: '[University Name]',
            location: '[City, State]',
            dates: '[Graduation Year]'
        }];
    }

    generateCertifications(userInfo) {
        return userInfo.certifications?.map(cert => ({
            name: cert.name || '[Certification Name]',
            issuer: cert.issuer || '[Issuing Organization]',
            date: cert.date || '[Issue Date]',
            credentialId: cert.credentialId || ''
        })) || [{
            name: '[Relevant Certification]',
            issuer: '[Issuing Organization]',
            date: '[Issue Date]'
        }];
    }

    generateAdditionalSections(userInfo) {
        const additionalSections = [];

        if (userInfo.projects) {
            additionalSections.push({
                title: 'Projects',
                items: userInfo.projects.map(project => ({
                    name: project.name || '[Project Name]',
                    description: project.description || '[Brief project description with quantifiable outcomes]',
                    technologies: project.technologies || '[Technologies/Skills Used]',
                    dates: project.dates || '[Project Duration]'
                }))
            });
        }

        if (userInfo.publications) {
            additionalSections.push({
                title: 'Publications',
                items: userInfo.publications.map(pub => ({
                    title: pub.title || '[Publication Title]',
                    publisher: pub.publisher || '[Publisher/Journal]',
                    date: pub.date || '[Publication Date]',
                    url: pub.url || ''
                }))
            });
        }

        if (userInfo.volunteer) {
            additionalSections.push({
                title: 'Volunteer Experience',
                items: userInfo.volunteer.map(vol => ({
                    role: vol.role || '[Volunteer Role]',
                    organization: vol.organization || '[Organization Name]',
                    dates: vol.dates || '[Duration]',
                    description: vol.description || '[Impact and Responsibilities]'
                }))
            });
        }

        return additionalSections.length > 0 ? additionalSections : [{
            title: 'Additional Information',
            items: ['[Add relevant projects, publications, or volunteer experience to strengthen your CV]']
        }];
    }

    getTemplateOptimizationTips() {
        return [
            {
                category: 'Content',
                tip: 'Customize each section with specific, quantifiable achievements relevant to the target role',
                priority: 'high'
            },
            {
                category: 'Keywords',
                tip: 'Incorporate job-specific keywords from the job description to improve ATS compatibility',
                priority: 'high'
            },
            {
                category: 'Structure',
                tip: 'Use clear, concise bullet points (3-5 per role) to highlight key responsibilities and achievements',
                priority: 'medium'
            },
            {
                category: 'Length',
                tip: 'Keep the CV to 1-2 pages, prioritizing the most recent and relevant information',
                priority: 'medium'
            },
            {
                category: 'Professional Summary',
                tip: 'Write a compelling summary (3-4 sentences) that highlights your unique value proposition',
                priority: 'high'
            }
        ];
    }

    getFormattingGuidelines() {
        return {
            font: 'Use professional fonts like Arial, Calibri, or Times New Roman (10-12pt)',
            margins: 'Maintain 0.5-1 inch margins on all sides',
            spacing: 'Use consistent single or 1.15 line spacing',
            headers: 'Use clear, bold section headers in slightly larger font (12-14pt)',
            bulletPoints: 'Use standard bullet points (•) for consistency',
            fileFormat: 'Save as both PDF and Word documents for ATS compatibility',
            avoid: [
                'Complex graphics or images',
                'Tables or columns',
                'Headers/footers for contact info',
                'Non-standard fonts or colors'
            ]
        };
    }
  
  async fetchIndustryTrends(industry) {
        try {
            const response = await fetch('https://api.x.ai/grok', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    industry,
                    prompt: `Search for current trends and in-demand skills in the ${industry} industry.`
                })
            });
            const trends = await response.json();
            this.industryKeywords[industry].push(...(trends.skills || []));
            return trends;
        } catch (error) {
            console.warn('Failed to fetch industry trends:', error);
            return { skills: [] };
        }
    }
}

// Initialize CVAnalyzer
const cvAnalyzer = new CVAnalyzer();

// DOM Elements
const profileName = document.getElementById('profile-name');
const profileJob = document.getElementById('profile-job');
const profileExperience = document.getElementById('profile-experience');
const profileAvatar = document.getElementById('profileAvatar');
const signOutBtn = document.getElementById('sign-out-btn');
const statusMessage = document.getElementById('status-message');
const followBtn = document.querySelector('.follow-btn');
const followingElement = document.getElementById('following-count');
const followersElement = document.getElementById('followers-count');
const cvScoreElement = document.getElementById('cv-score');
const cvScoreProgress = document.getElementById('cv-score-progress');
const cvIndustryElement = document.getElementById('cv-industry');
const cvSkillsElement = document.getElementById('cv-skills');
const cvTimestampElement = document.getElementById('cv-timestamp');

// UI Helper
function setStatus(message, type = 'info', duration = 5000) {
    console.log(`Status: ${message} (${type})`);
    if (!statusMessage) {
        console.warn("statusMessage element not found");
        return;
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message show status-${type}`;
    setTimeout(() => {
        statusMessage.classList.remove('show');
    }, duration);
}

// Fetch User Profile
async function fetchUserProfile() {
    console.log('Fetching user profile...');
    try {
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
            console.error("Session fetch error:", sessionError);
            setStatus(`Failed to fetch session: ${sessionError.message}`, "error");
            setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
            return null;
        }
        if (!session?.session) {
            console.error("No active session");
            setStatus("No active session. Redirecting to login...", "error");
            setTimeout(() => { window.location.href = "../templates/login.html"; }, 1500);
            return null;
        }
        console.log('Session user ID:', session.session.user.id);
        const { data, error } = await supabase
            .from("profiles")
            .select("full_name, job_title, experience_level, profile_picture_url")
            .eq("id", session.session.user.id)
            .single();
        if (error) {
            console.error("Profile fetch error:", error);
            setStatus(`Failed to load profile: ${error.message}`, "error");
            return null;
        }
        if (!data) {
            console.warn("No profile data found for user ID:", session.session.user.id);
            setStatus("Profile not found. Please complete your profile.", "error");
            return null;
        }
        if (profileName && data.full_name) {
            profileName.textContent = data.full_name;
        }
        if (profileJob && data.job_title) {
            profileJob.textContent = data.job_title;
        }
        if (profileExperience && data.experience_level) {
            profileExperience.textContent = `${data.experience_level} Level`;
        }
        if (profileAvatar && data.profile_picture_url) {
            profileAvatar.src = data.profile_picture_url;
        }
        return data;
    } catch (err) {
        console.error("Unexpected error in fetchUserProfile:", err);
        setStatus(`Error fetching profile: ${err.message || "Unexpected error"}`, "error");
        return null;
    }
}

// Fetch Latest CV Analysis from Supabase
async function fetchLatestCVAnalysis() {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) return null;

        const { data, error } = await supabase
            .from('cv_analysis')
            .select('score, industry, skills, timestamp')
            .eq('user_id', session.session.user.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('CV analysis fetch error:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.error('Unexpected error in fetchLatestCVAnalysis:', err);
        return null;
    }
}

// Update Profile with CV Analysis Data
async function updateProfileWithCVData() {
    const cvData = await fetchLatestCVAnalysis();
    if (cvData) {
        if (cvScoreElement) {
            cvScoreElement.textContent = `${cvData.score}%`;
            cvScoreProgress.style.width = `${cvData.score}%`;
        }
        if (cvIndustryElement) {
            cvIndustryElement.textContent = cvData.industry.charAt(0).toUpperCase() + cvData.industry.slice(1);
        }
        if (cvSkillsElement) {
            cvSkillsElement.textContent = cvData.skills.slice(0, 3).join(', ') || 'None listed';
        }
        if (cvTimestampElement) {
            cvTimestampElement.textContent = new Date(cvData.timestamp).toLocaleString();
        }
    }
}

// Save CV Analysis to Supabase
async function saveCVAnalysis(analysis, cvText, fileName) {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) {
            setStatus('Please sign in to save CV analysis.', 'error');
            return;
        }

        const { error } = await supabase
            .from('cv_analysis')
            .insert({
                user_id: session.session.user.id,
                score: analysis.overallScore,
                industry: analysis.industryMatch.industry,
                skills: analysis.skillsAnalysis.skills,
                timestamp: analysis.timestamp,
                cv_text: cvText,
                file_name: fileName,
                analysis_data: analysis
            });

        if (error) {
            console.error('Error saving CV analysis:', error);
            setStatus(`Failed to save CV analysis: ${error.message}`, 'error');
        } else {
            setStatus('CV analysis saved successfully!', 'success');
            updateProfileWithCVData();
        }
    } catch (err) {
        console.error('Unexpected error in saveCVAnalysis:', err);
        setStatus('Error saving CV analysis.', 'error');
    }
}

// Extract Text from CV File
async function extractTextFromFile(file) {
    if (file.type === 'application/pdf') {
        // Check if pdfjsLib is available
        if (!window.pdfjsLib) {
            setStatus('PDF processing library failed to load. Please try again later.', 'error');
            throw new Error('pdf.js library not loaded');
        }

        // Set worker source
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
    const resultContainer = document.getElementById('result');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileType = document.getElementById('fileType');

    if (cvUpload.files.length === 0) {
        resultContainer.innerHTML = '<p class="error">Please select a file to upload.</p>';
        return;
    }

    const file = cvUpload.files[0];
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        resultContainer.innerHTML = '<p class="error">File size exceeds 10MB limit.</p>';
        return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
    fileType.textContent = `Type: ${file.type}`;
    fileInfo.style.display = 'block';

    analyzeBtn.disabled = true;
    btnText.style.display = 'none';
    loadingSpinner.style.display = 'flex';

    try {
        const cvText = await extractTextFromFile(file);
        const jobDescription = document.getElementById('jobDescription')?.value || '';
        const analysis = await cvAnalyzer.analyzeCVContent(cvText, jobDescription);
        await saveCVAnalysis(analysis, cvText, file.name);
        updateAnalysisResults(analysis);

        const userInfo = await fetchUserProfile();
        const perfectCV = await cvAnalyzer.generatePerfectCV({
            name: userInfo?.full_name,
            title: userInfo?.job_title,
            experience: analysis.experienceLevel.estimatedYears
        }, userInfo?.job_title, analysis.industryMatch.industry);
        updateCVTemplate(perfectCV);
    } catch (error) {
        resultContainer.innerHTML = `<p class="error">Error analyzing CV: ${error.message}</p>`;
        setStatus(`Error analyzing CV: ${error.message}`, 'error');
    } finally {
        analyzeBtn.disabled = false;
        btnText.style.display = 'inline';
        loadingSpinner.style.display = 'none';
    }
}
// Update Analysis Results
function updateAnalysisResults(analysis) {
    const resultContainer = document.getElementById('result');
    resultContainer.innerHTML = `
        <div class="result-header">
            <h3 class="result-title">CV Analysis Results</h3>
            <p class="result-subtitle">Here's what we found in your CV</p>
        </div>
        <div class="score-section">
            <div class="score-circle">
                <span class="score-value">${analysis.overallScore}</span>
            </div>
            <div class="score-label">Overall CV Score</div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${analysis.overallScore}%"></div>
            </div>
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">✓</div> Strengths</h4>
            ${analysis.sections.present.map(section => `
                <div class="analysis-item positive">
                    <div class="analysis-text">${section.charAt(0).toUpperCase() + section.slice(1)} section is well-structured</div>
                </div>
            `).join('')}
            ${analysis.skillsAnalysis.skills.length > 5 ? `
                <div class="analysis-item positive">
                    <div class="analysis-text">Strong skills section with ${analysis.skillsAnalysis.skills.length} relevant skills</div>
                </div>
            ` : ''}
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">⚠</div> Areas for Improvement</h4>
            ${analysis.sections.missing.map(section => `
                <div class="analysis-item negative">
                    <div class="analysis-text">Missing ${section.charAt(0).toUpperCase() + section.slice(1)} section</div>
                </div>
            `).join('')}
            ${analysis.keywords.matchPercentage < 60 ? `
                <div class="analysis-item negative">
                    <div class="analysis-text">Low keyword match rate (${analysis.keywords.matchPercentage}%). Add: ${analysis.keywords.missingKeywords.slice(0, 3).join(', ')}</div>
                </div>
            ` : ''}
        </div>
        <div class="analysis-section">
            <h4 class="section-title"><div class="section-icon">💡</div> Recommendations</h4>
            ${analysis.recommendations.map(rec => `
                <div class="analysis-item ${rec.type}" onclick="showAIExample('${rec.message}')">
                    <div class="analysis-text">${rec.message}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show AI-Generated Example for Recommendation
async function showAIExample(recommendation) {
    try {
        const response = await fetch('https://api.x.ai/grok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recommendation,
                prompt: `Provide an example implementation for this CV recommendation: ${recommendation}`
            })
        });
        const example = await response.json();
        setStatus(`Example: ${example}`, 'info', 10000);
    } catch (error) {
        setStatus('Failed to load example.', 'error');
    }
}

// Update CV Template
function updateCVTemplate(perfectCV) {
    const templateContainer = document.createElement('div');
    templateContainer.className = 'template-container';
    templateContainer.innerHTML = `
        <div class="template-header">
            <h3 class="template-title">Generated CV Template</h3>
            <p class="template-subtitle">Optimized for your target role</p>
            <button class="download-btn" onclick="downloadCV()">Download CV</button>
        </div>
        <div class="template-section">
            <h4>Header</h4>
            <p><strong>Name:</strong> ${perfectCV.template.header.name}</p>
            <p><strong>Title:</strong> ${perfectCV.template.header.title}</p>
            <p><strong>Contact:</strong> ${perfectCV.template.header.email} | ${perfectCV.template.header.phone} | ${perfectCV.template.header.linkedin}</p>
        </div>
        <div class="template-section">
            <h4>Professional Summary</h4>
            <p>${perfectCV.template.professionalSummary}</p>
        </div>
        <div class="template-section">
            <h4>Core Competencies</h4>
            <ul>${perfectCV.template.coreCompetencies.map(comp => `<li>${comp}</li>`).join('')}</ul>
        </div>
        <div class="template-section">
            <h4>Professional Experience</h4>
            ${perfectCV.template.professionalExperience.map(exp => `
                <div class="experience-item">
                    <p><strong>${exp.title}</strong> | ${exp.company} | ${exp.dates}</p>
                    <ul>${exp.achievements.map(ach => `<li>${ach}</li>`).join('')}</ul>
                </div>
            `).join('')}
        </div>
        <div class="template-section">
            <h4>Education</h4>
            ${perfectCV.template.education.map(edu => `
                <p>${edu.degree} | ${edu.institution} | ${edu.dates}</p>
            `).join('')}
        </div>
        <div class="template-section">
            <h4>Certifications</h4>
            ${perfectCV.template.certifications.map(cert => `
                <p>${cert.name} | ${cert.issuer} | ${cert.date}</p>
            `).join('')}
        </div>
        <div class="template-section">
            <h4>Additional Sections</h4>
            ${perfectCV.template.additionalSections.map(section => `
                <div>
                    <h5>${section.title}</h5>
                    <ul>${section.items.map(item => `<li>${typeof item === 'string' ? item : item.name || item.role || item.title}</li>`).join('')}</ul>
                </div>
            `).join('')}
        </div>
        <div class="template-tips">
            <h4>Optimization Tips</h4>
            ${perfectCV.tips.map(tip => `
                <p><strong>${tip.category}:</strong> ${tip.tip} (${tip.priority} priority)</p>
            `).join('')}
        </div>
    `;
    document.getElementById('result').appendChild(templateContainer);
}

// Download CV as PDF
function downloadCV() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.html(document.querySelector('.template-container'), {
        callback: () => doc.save('optimized_cv.pdf'),
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 800
    });
}

// Existing Functions (Unchanged)
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const tabContent = document.getElementById(`${tab}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    const navItem = document.querySelector(`.nav-item[data-tab="${tab}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}

function toggleLike(button) {
    button.classList.toggle('liked');
    button.textContent = button.classList.contains('liked') ? '❤️ Liked' : '❤️';
}

function applyForJob() {
    alert("Job application submitted!");
}

function handleAddClick() {
    switchTab('add-post');
}

function markAsRead(notification) {
    notification.classList.remove('unread');
    notification.querySelector('.notification-badge')?.remove();
}

function updateCharCount(textarea) {
    const charCounter = document.getElementById('char-counter');
    if (charCounter) {
        charCounter.textContent = textarea.value.length;
        const postBtn = document.querySelector('.post-btn');
        postBtn.disabled = textarea.value.length === 0;
    }
}

function handleMediaUpload(type) {
    alert(`Uploading ${type}...`);
}

function addPoll() {
    alert("Adding a poll...");
}

function addCelebration() {
    alert("Adding a celebration...");
}

function cancelPost() {
    document.querySelector('.post-textarea').value = '';
    updateCharCount(document.querySelector('.post-textarea'));
    switchTab('home');
}

function publishPost() {
    alert("Post published!");
    cancelPost();
}

function handleFeatureClick(feature) {
    if (feature === 'cv-analyzer') {
        switchTab('cv-analyzer');
    } else {
        alert(`Opening ${feature}...`);
    }
}

async function toggleFollow(profileUserId = null) {
    if (!followBtn) {
        console.error("Follow button not found");
        setStatus("Follow button not found", "error");
        return;
    }

    const currentUserId = (await supabase.auth.getSession()).data.session?.user.id;
    if (!currentUserId) {
        setStatus("No active session. Please sign in.", "error");
        return;
    }

    const viewedUserId = profileUserId || currentUserId;
    if (currentUserId === viewedUserId) {
        setStatus("Cannot follow yourself.", "error");
        return;
    }

    const isFollowing = followBtn.textContent === 'Unfollow';
    try {
        if (isFollowing) {
            const { error } = await supabase
                .from("follows")
                .delete()
                .eq("follower_id", currentUserId)
                .eq("followed_id", viewedUserId);
            if (error) throw error;
            followBtn.textContent = 'Follow';
            updateFollowCounts(-1, -1);
            setStatus("Unfollowed.", "success");
        } else {
            const { error } = await supabase
                .from("follows")
                .insert({ follower_id: currentUserId, followed_id: viewedUserId });
            if (error) throw error;
            followBtn.textContent = 'Unfollow';
            updateFollowCounts(1, 1);
            setStatus("Followed!", "success");
        }
    } catch (err) {
        console.error("Follow toggle error:", err);
        setStatus(`Follow action failed: ${err.message}`, "error");
        followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
    }
}

function updateFollowCounts(deltaFollowing, deltaFollowers) {
    if (followingElement) {
        let currentCount = parseInt(followingElement.textContent.replace(/[^0-9]/g, '')) || 0;
        currentCount += deltaFollowing;
        followingElement.textContent = currentCount >= 1000 ? (currentCount / 1000).toFixed(1) + 'k' : currentCount;
    }
    if (followersElement) {
        let currentCount = parseInt(followersElement.textContent.replace(/[^0-9]/g, '')) || 0;
        currentCount += deltaFollowers;
        followersElement.textContent = currentCount >= 1000 ? (currentCount / 1000).toFixed(1) + 'k' : currentCount;
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Sign-out error:", error);
            setStatus(`Sign out failed: ${error.message}`, "error");
            return;
        }
        setStatus("Successfully signed out! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "../templates/login.html";
        }, 1500);
    } catch (err) {
        console.error("Unexpected sign-out error:", err);
        setStatus(`Sign out error: ${err.message || "Unexpected error occurred"}`, "error");
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await fetchUserProfile();
        await updateProfileWithCVData();

        if (signOutBtn) {
            signOutBtn.addEventListener('click', signOut);
        }

        const uploadContainer = document.getElementById('uploadContainer');
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

        document.getElementById('cvUpload').addEventListener('change', () => {
            document.getElementById('analyzeBtn').disabled = document.getElementById('cvUpload').files.length === 0;
        });

        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setStatus('You have been signed out.', 'info');
                window.location.href = '../templates/login.html';
            } else if (event === 'SIGNED_IN' && session) {
                fetchUserProfile();
                updateProfileWithCVData();
            }
        });
    } catch (err) {
        console.error('Initialization error:', err);
        setStatus('Error initializing app: ' + err.message, 'error');
    }
});
  