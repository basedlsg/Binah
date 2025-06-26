#!/usr/bin/env python3
import click
import asyncio
import json
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.text import Text # For more control over text styling
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel
from rich.markdown import Markdown
import httpx
from typing import Optional, Dict, Any # Added Any
import os
from dotenv import load_dotenv

# Initialize logger for CLI specific messages if needed, or use console directly
console = Console()

# --- Helper to load .env from project root --- 
def load_project_dotenv():
    # Try to find .env up to two levels up to catch project root from cli/ or quest-dev-copilot/
    # Assumes this script is in <project_root>/cli/
    env_path = Path(__file__).resolve().parent.parent / '.env' 
    if not env_path.exists():
        # Fallback if script is run from project root itself (e.g. python cli/quest_fix.py)
        env_path = Path.cwd() / '.env' 
    
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)
        # console.print(f"[dim].env loaded from: {env_path}[/dim]") # Optional debug line
    else:
        # console.print(f"[dim].env not found at expected project root paths: {env_path}[/dim]")
        pass # Allow running if env vars are already set system-wide

load_project_dotenv()

class QuestFixCLI:
    """CLI tool for analyzing Quest VR build errors using the backend API."""
    
    def __init__(self, backend_url: Optional[str] = None):
        # Prioritize explicit URL, then ENV, then default
        self.backend_url = backend_url or os.getenv('BACKEND_URL', 'http://localhost:5000')
        if not self.backend_url:
            console.print("[bold red]Error: Backend URL is not specified.[/bold red]")
            console.print("Please set the BACKEND_URL environment variable or use the --backend-url option.")
            raise click.Abort()
        console.print(f"[dim]CLI targeting backend: {self.backend_url}[/dim]")
        
    async def analyze_log(self, log_file_path: str) -> Optional[Dict[str, Any]]:
        """Reads a log file and sends its content to the backend for analysis."""
        try:
            with open(log_file_path, 'r', encoding='utf-8', errors='ignore') as f:
                log_content = f.read()
        except FileNotFoundError:
            console.print(f"[bold red]Error: Log file not found at {log_file_path}[/bold red]")
            return None
        except Exception as e:
            console.print(f"[bold red]Error reading log file {log_file_path}: {e}[/bold red]")
            return None
        
        lines = log_content.split('\n')
        if len(lines) > 5000:
            log_content = '\n'.join(lines[-5000:])
            console.print("[yellow]Log content truncated to the last 5000 lines for analysis.[/yellow]")
        
        payload = {"log_content": log_content}
        console.print(f"Sending {len(log_content):,} chars from log to {self.backend_url}/analyze")

        try:
            async with httpx.AsyncClient(timeout=120.0) as client: # Increased timeout for potentially long LLM calls
                response = await client.post(f"{self.backend_url}/analyze", json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            console.print(f"[bold red]API Error: {e.response.status_code} - {e.response.text}[/bold red]")
            if e.response.status_code == 400:
                try: console.print(Panel(json.dumps(e.response.json(), indent=2), title="Details"))
                except: pass # Ignore if details are not JSON
        except httpx.RequestError as e:
            console.print(f"[bold red]Connection Error: Failed to connect to backend at {self.backend_url}.[/bold red]")
            console.print(f"Details: {e}")
            console.print("[yellow]Ensure the backend server is running and accessible.[/yellow]")
        except json.JSONDecodeError:
            console.print("[bold red]API Error: Received invalid JSON response from backend.[/bold red]")
        return None
    
    def display_results(self, results: Dict[str, Any]):
        if not results:
            console.print("[yellow]No analysis results to display.[/yellow]"); return

        console.print(Panel(f"Analysis for Request ID: [cyan]{results.get('request_id', 'N/A')}[/cyan]", title="Analysis Overview", expand=False))

        classification = results.get('classification', {})
        class_table = Table(title="Error Classification", show_header=True, header_style="bold magenta")
        class_table.add_column("Property", style="cyan", width=20); class_table.add_column("Value", style="green")
        class_table.add_row("Error Type", str(classification.get('error_type', 'N/A')))
        class_table.add_row("Confidence", f"{classification.get('confidence', 0.0) * 100:.1f}%")
        class_table.add_row("Auto-fixable", "✓ Yes" if classification.get('auto_fixable') else "✗ No")
        if classification.get('key_indicators'): class_table.add_row("Indicators", ", ".join(classification['key_indicators'][:5]))
        if classification.get('explanation'): class_table.add_row("Explanation", classification['explanation'])
        console.print(class_table)

        fix_suggestion = results.get('fix_suggestion_text', 'No specific fix suggestion provided.')
        console.print(Panel(Markdown(fix_suggestion), title="[blue]Fix Suggestion[/blue]", border_style="blue", expand=False))

        auto_fix = results.get('auto_fix_generated')
        if auto_fix:
            af_panel_content = f"[bold]Description:[/bold] {auto_fix.get('description', 'N/A')}\n"
            if auto_fix.get('steps'): af_panel_content += "[bold]Steps:[/bold]\n" + "\n".join([f"- {s}" for s in auto_fix['steps']])
            if auto_fix.get('confidence') is not None: af_panel_content += f"\n[bold]Confidence:[/bold] {auto_fix['confidence'] * 100:.1f}%"
            console.print(Panel(af_panel_content, title="[green]Auto-Fix Details[/green]", border_style="green", expand=False))
        
        sources = results.get('relevant_sources', [])
        if sources:
            console.print("[bold underline]Relevant Sources:[/bold underline]")
            for i, src in enumerate(sources[:3]):
                src_title = src.get('title', 'Unknown Source'); src_url = src.get('url'); src_dist = src.get('distance')
                source_text = f"{i+1}. {src_title}"
                if src_url: source_text += f" ([link={src_url}]link[/link])"
                if src_dist is not None: source_text += f" [dim](score: {1-src_dist:.2f})[/dim]"
                console.print(source_text)
                if src.get('snippet'): console.print(Panel(Text(src['snippet'], overflow="fold"), padding=(0,1), border_style="dim cyan"))
            if len(sources) > 3: console.print(f"[dim]...and {len(sources)-3} more sources.[/dim]")
        console.print()

        metrics = results.get('metrics', {})
        if metrics:
            m_text = f"Total: {metrics.get('total_processing_time_ms', 0)/1000:.2f}s | "
            m_text += f"RAG: {metrics.get('retrieval_time_ms',0)/1000:.2f}s | "
            m_text += f"Classify: {metrics.get('classification_time_ms',0)/1000:.2f}s (Tokens: {metrics.get('tokens_used_classification','N/A')}) | "
            m_text += f"FixGen: {metrics.get('fix_generation_time_ms',0)/1000:.2f}s (Tokens: {metrics.get('tokens_used_fix_generation','N/A')})"
            console.print(Panel(m_text, title="Performance Metrics", border_style="yellow", expand=False))

        processing_errors = results.get('processing_errors')
        if processing_errors:
            console.print(Panel("\n".join([f"- {err}" for err in processing_errors]), title="[red]Backend Processing Errors[/red]", border_style="red", expand=False))

    def _apply_auto_fix_placeholder(self, results: dict, project_path_str: str):
        console.print("[yellow]Auto-fix application is conceptual in this CLI.[/yellow]")
        auto_fix_generated = results.get('auto_fix_generated')
        if auto_fix_generated:
            console.print("[bold]Backend suggested auto-fix data:[/bold]")
            console.print(json.dumps(auto_fix_generated, indent=2))
        else:
            console.print("[yellow]No auto-fix data received from backend to demonstrate.[/yellow]")
        # Actual logic from user's script (toggle_plugin, update_config) would go here
        # and would need the backend to provide structured 'action_type' and 'details'.
        return False # Placeholder return

@click.command()
@click.argument('log_file', type=click.Path(exists=True, dir_okay=False, resolve_path=True))
@click.option('--backend-url', envvar='BACKEND_URL', help='Backend API URL. Overrides .env or default.')
@click.option('--apply-fix', is_flag=True, help='(Conceptual) Attempt to apply auto-fix if suggested.')
@click.option('--output-json', type=click.Path(dir_okay=False, writable=True), help='Save full JSON results to this file path.')
@click.option('--project-path', type=click.Path(exists=True, file_okay=False, resolve_path=True), default=".", help='Path to Unreal project root (for future auto-fix). Defaults to CWD.')
def quest_fix_cli(log_file: str, backend_url: Optional[str], apply_fix: bool, output_json: Optional[str], project_path: str):
    """Analyzes Unreal Engine logs for Quest VR development errors via the Quest Dev Copilot backend."""
    console.print(Panel.fit("[bold cyan]Quest Dev Copilot CLI[/bold cyan]", border_style="blue", padding=(1,2)))
    cli = QuestFixCLI(backend_url=backend_url) # Pass explicitly if provided
    
    async def run_analysis():
        results = None
        with Progress(SpinnerColumn(spinner_name="dots12"), TextColumn("[progress.description]{task.description}"), console=console, transient=True) as progress_bar:
            task_id = progress_bar.add_task("[yellow]Analyzing log with backend...[/yellow]", total=None)
            try:
                results = await cli.analyze_log(log_file)
                if results: progress_bar.update(task_id, description="[green]Analysis complete![/green]")
                else: progress_bar.update(task_id, description="[red]Analysis failed.[/red]")
            except Exception as e: # Catch any unexpected error from analyze_log if it doesn't abort
                progress_bar.update(task_id, description="[red]Critical analysis error.[/red]")
                console.print(f"[bold red]Unhandled error during analysis: {e}[/bold red]")
                return # Stop further processing
            finally:
                # Ensure progress is stopped and hidden even if an abort happens within analyze_log
                if progress_bar.tasks and task_id < len(progress_bar.tasks) and progress_bar.tasks[task_id].started:
                     progress_bar.stop_task(task_id)
                     progress_bar.update(task_id, visible=False)
        
        if not results: console.print("[bold red]Failed to get results from backend.[/bold red]"); return
        cli.display_results(results)
        if output_json:
            try:
                with open(output_json, 'w', encoding='utf-8') as f: json.dump(results, f, indent=2, ensure_ascii=False)
                console.print(f"\n[green]Full analysis results saved to: {Path(output_json).resolve()}[/green]")
            except Exception as e: console.print(f"[red]Error saving results to {output_json}: {e}[/red]")
        if apply_fix: 
            console.print("\n[bold]Auto-Fix Attempt (Conceptual):[/bold]")
            cli._apply_auto_fix_placeholder(results, project_path)
    
    asyncio.run(run_analysis())

if __name__ == '__main__':
    quest_fix_cli() 