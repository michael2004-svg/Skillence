// course_upload.js - For course creators/admins
async function uploadCourseDocument(file, courseId) {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) throw new Error('Not authenticated');

        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `courses/${courseId}/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await window.supabaseClient.storage
            .from('course-materials')
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('course-materials')
            .getPublicUrl(filePath);

        return publicUrl;

    } catch (error) {
        console.error('Error uploading course document:', error);
        throw error;
    }
}

async function uploadCourseThumbnail(file, courseId) {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) throw new Error('Not authenticated');

        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `thumbnail_${courseId}.${fileExt}`;
        const filePath = `thumbnails/${fileName}`;

        // Upload to Supabase Storage
        const { data, error } = await window.supabaseClient.storage
            .from('course-materials')
            .upload(filePath, file, {
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('course-materials')
            .getPublicUrl(filePath);

        return publicUrl;

    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        throw error;
    }
}

// Create course (admin function)
async function createCourse(courseData, thumbnailFile, contentFile) {
    try {
        const userId = await window.SkillenceCore.getUserId();
        if (!userId) throw new Error('Not authenticated');

        // First create the course
        const { data: course, error: courseError } = await window.supabaseClient
            .from('courses')
            .insert({
                title: courseData.title,
                description: courseData.description,
                instructor_name: courseData.instructorName,
                instructor_id: userId,
                price: courseData.price,
                duration: courseData.duration,
                level: courseData.level,
                category: courseData.category
            })
            .select()
            .single();

        if (courseError) throw courseError;

        // Upload thumbnail if provided
        if (thumbnailFile) {
            const thumbnailUrl = await uploadCourseThumbnail(thumbnailFile, course.id);
            await window.supabaseClient
                .from('courses')
                .update({ thumbnail_url: thumbnailUrl })
                .eq('id', course.id);
        }

        // Upload content file if provided
        if (contentFile) {
            const contentUrl = await uploadCourseDocument(contentFile, course.id);
            await window.supabaseClient
                .from('courses')
                .update({ content_url: contentUrl })
                .eq('id', course.id);
        }

        return course;

    } catch (error) {
        console.error('Error creating course:', error);
        throw error;
    }
}

window.CourseUploadModule = {
    uploadCourseDocument,
    uploadCourseThumbnail,
    createCourse
};

