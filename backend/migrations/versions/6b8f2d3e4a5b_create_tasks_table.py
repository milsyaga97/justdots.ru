from alembic import op
import sqlalchemy as sa
from app.tasks.models import TaskStatus

revision = '6b8f2d3e4a5b'
down_revision = '5a1649caf4a3'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('budget_min', sa.Float(), nullable=True),
        sa.Column('budget_max', sa.Float(), nullable=True),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('category', sa.Enum('Разработка', 'Дизайн', 'Программирование', 'Копирайтинг', 'Другое', name='taskcategory'), nullable=False),
        sa.Column('custom_category', sa.String(length=255), nullable=True),
        sa.Column('skill_level', sa.Enum('Менее года', 'От 1 до 3 лет', 'Более 3 лет', name='taskskilllevel'), nullable=False),
        sa.Column('status', sa.Enum("На рассмотрении модерацией", "Отклонена модерацией", 'Открытая', 'В процессе', 'Закрытая', name='taskstatus'), nullable=False, server_default=TaskStatus.PENDING_MODERATION.value),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('submitted_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_id'), table_name='tasks')
    op.drop_table('tasks')
    op.execute('DROP TYPE taskcategory')
    op.execute('DROP TYPE taskskilllevel')
    op.execute('DROP TYPE taskstatus')