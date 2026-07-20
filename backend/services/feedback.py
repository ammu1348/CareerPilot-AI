def generate_feedback(score):
    if score >= 80:
        return "Excellent Resume! You are ready to apply for top companies."

    elif score >= 60:
        return "Good Resume. Add more projects and certifications to improve."

    elif score >= 40:
        return "Average Resume. Improve skills, projects and resume formatting."

    else:
        return "Resume needs significant improvement. Add skills, projects and experience."