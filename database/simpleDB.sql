CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'parent', 'guest');
CREATE TYPE problem_type AS ENUM ('equation', 'word_problem', 'graphing');
CREATE TYPE submission_status AS ENUM ('pending', 'processing', 'completed', 'error');
CREATE TYPE verification_status AS ENUM ('correct', 'incorrect', 'partial');

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_guest BOOLEAN DEFAULT FALSE,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    problems_attempted INTEGER DEFAULT 0,
    problems_completed INTEGER DEFAULT 0,
    CONSTRAINT valid_session_times CHECK (end_time IS NULL OR end_time >= start_time)
);

CREATE TABLE problem_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    problem_type problem_type NOT NULL,
    problem_text TEXT,
    image_url VARCHAR(500),
    recognized_text TEXT,
    recognition_confidence FLOAT CHECK (recognition_confidence >= 0 AND recognition_confidence <= 1),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status submission_status DEFAULT 'pending',
    CONSTRAINT problem_input_required CHECK (problem_text IS NOT NULL OR image_url IS NOT NULL)
);

CREATE TABLE solution_steps (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES problem_submissions(submission_id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_description TEXT NOT NULL,
    step_explanation TEXT NOT NULL,
    verification_status verification_status,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_step_number CHECK (step_number > 0),
    CONSTRAINT unique_step_per_submission UNIQUE (submission_id, step_number)
);

CREATE TABLE hint_requests (
    hint_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES problem_submissions(submission_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    hint_text TEXT NOT NULL,
    hint_level INTEGER CHECK (hint_level >= 1 AND hint_level <= 5),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE performance_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    total_problems INTEGER DEFAULT 0,
    correct_problems INTEGER DEFAULT 0,
    average_time_seconds FLOAT,
    analytics_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_problem_counts CHECK (correct_problems <= total_problems),
    CONSTRAINT unique_user_topic_date UNIQUE (user_id, topic, analytics_date)
);

CREATE TABLE teacher_student (
    relationship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT different_users CHECK (teacher_id != student_id),
    CONSTRAINT unique_teacher_student UNIQUE (teacher_id, student_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_submissions_user ON problem_submissions(user_id);
CREATE INDEX idx_submissions_session ON problem_submissions(session_id);
CREATE INDEX idx_submissions_status ON problem_submissions(status);
CREATE INDEX idx_solution_steps_submission ON solution_steps(submission_id);
CREATE INDEX idx_hint_requests_submission ON hint_requests(submission_id);
CREATE INDEX idx_hint_requests_user ON hint_requests(user_id);
CREATE INDEX idx_performance_user ON performance_analytics(user_id);
CREATE INDEX idx_performance_date ON performance_analytics(analytics_date);
CREATE INDEX idx_teacher_student_teacher ON teacher_student(teacher_id);
CREATE INDEX idx_teacher_student_student ON teacher_student(student_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to performance_analytics
CREATE TRIGGER update_performance_analytics_updated_at
    BEFORE UPDATE ON performance_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();