from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def delete_existing_roll_history(apps, schema_editor):
    RollHistory = apps.get_model('characters', 'RollHistory')
    RollHistory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('characters', '0009_rollhistory_note'),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('active_character', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='characters.character')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.RunPython(delete_existing_roll_history, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='rollhistory',
            name='character',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='roll_history', to='characters.character'),
        ),
    ]
